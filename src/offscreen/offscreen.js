/* Offscreen document — captures the Meet tab audio and periodically sends
 * WAV chunks to a local Whisper-compatible STT endpoint. Transcribed text is
 * relayed back to the content script as a "Tab" channel.
 *
 * Flow:
 *  service-worker (getMediaStreamId) -> here (getUserMedia w/ streamId)
 *  -> MediaRecorder in slices -> POST multipart to sttEndpoint -> transcript
 *  -> chrome.runtime.sendMessage({type:'stt-result', text}) -> content script
 */

const TAG = '[meet-coach:offscreen]';
let mediaStream = null;
let recorder = null;
let chunks = [];
let sttConfig = null;
let chunkTimer = null;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'offscreen:start-tab') {
    sttConfig = { endpoint: msg.sttEndpoint, model: msg.sttModel, apiKey: msg.sttApiKey };
    if (!msg.streamId) {
      sendResponse({ ok: false, error: 'streamId ausente' });
      return false;
    }
    startCapture(msg.streamId)
      .then(() => {
        reportSttStatus('active', 'captura iniciada');
        sendResponse({ ok: true });
      })
      .catch((e) => {
        console.warn(TAG, 'capture failed', e);
        reportSttStatus('error', String(e?.message || e).slice(0, 120));
        sendResponse({ ok: false, error: String(e?.message || e) });
      });
    return true;
  }
  if (msg?.type === 'offscreen:stop') {
    stopCapture();
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

async function startCapture(streamId) {
  stopCapture();
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      // Chrome tab capture provides a single track with the tab's audio.
      mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId },
      optional: [{ googDisableLocalEcho: false }],
    },
    video: false,
  });

  const tracks = mediaStream.getAudioTracks();
  if (tracks.length === 0) {
    throw new Error('Nenhuma faixa de áudio na captura da aba');
  }
  // Ensure the track is enabled/unmuted.
  tracks.forEach((t) => { t.enabled = true; });
  console.log(TAG, 'tab audio track:', tracks[0].label || '(sem nome)', 'muted:', tracks[0].muted);

  chunks = [];
  const mime = pickMime();
  recorder = new MediaRecorder(mediaStream, mime ? { mimeType: mime } : undefined);
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onerror = (e) => console.warn(TAG, 'MediaRecorder error', e?.error || e);
  // Start with a timeslice so dataavailable fires periodically on its own.
  recorder.start(2000);
  console.log(TAG, 'MediaRecorder started, mime:', mime || 'default');

  // Additionally flush accumulated chunks every N seconds.
  chunkTimer = setInterval(() => {
    if (chunks.length > 0) flushToStt();
  }, 8000);
}

function pickMime() {
  // Prefer webm/opus which Whisper-compatible endpoints accept reliably.
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

function stopCapture() {
  clearInterval(chunkTimer); chunkTimer = null;
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop(); } catch {}
  }
  recorder = null;
  if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
}

let sttErrorCount = 0;
let sttSuccessCount = 0;

async function flushToStt() {
  if (!sttConfig || !sttConfig.endpoint) return;
  if (chunks.length === 0) return;
  const blob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' });
  chunks = [];
  if (blob.size < 2000) return; // skip near-empty slices

  const fd = new FormData();
  // Whisper endpoints accept common formats (webm/opus, wav, mp3). webm/opus
  // works with faster-whisper-server and whisper.cpp in most builds.
  fd.append('file', blob, 'chunk.webm');
  fd.append('response_format', 'json');
  if (sttConfig.model) fd.append('model', sttConfig.model);
  if (sttConfig.apiKey) fd.append('language', 'pt');

  try {
    const res = await fetch(sttConfig.endpoint, {
      method: 'POST',
      headers: sttConfig.apiKey ? { Authorization: `Bearer ${sttConfig.apiKey}` } : {},
      body: fd,
    });
    if (!res.ok) {
      sttErrorCount++;
      const detail = await res.text().catch(() => '');
      console.warn(TAG, 'STT HTTP', res.status, detail.slice(0, 200));
      reportSttStatus('error', `HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    const text = (data?.text || '').trim();
    sttSuccessCount++;
    if (sttErrorCount > 0) sttErrorCount = 0; // reset on success
    if (text) chrome.runtime.sendMessage({ type: 'stt-result', text }).catch(() => {});
    reportSttStatus('active', `${sttSuccessCount} chunks ok`);
  } catch (e) {
    sttErrorCount++;
    console.warn(TAG, 'STT fetch failed', e);
    reportSttStatus('error', String(e?.message || e).slice(0, 120));
  }
}

// Report STT health back to the content script so the panel can show it.
function reportSttStatus(state, detail) {
  chrome.runtime.sendMessage({ type: 'stt-status', state, detail }).catch(() => {});
}
