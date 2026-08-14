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
    startCapture(msg.streamId).then(() => sendResponse({ ok: true })).catch((e) => {
      console.warn(TAG, 'capture failed', e);
      sendResponse({ ok: false, error: String(e) });
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
    },
    video: false,
  });

  chunks = [];
  recorder = new MediaRecorder(mediaStream, { mimeType: pickMime() });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  // Start with a timeslice so dataavailable fires periodically on its own.
  recorder.start(2000);

  // Additionally flush accumulated chunks every N seconds.
  chunkTimer = setInterval(() => {
    if (chunks.length > 0) flushToStt();
  }, 8000);
}

function pickMime() {
  for (const m of ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg']) {
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

  try {
    const res = await fetch(sttConfig.endpoint, {
      method: 'POST',
      headers: sttConfig.apiKey ? { Authorization: `Bearer ${sttConfig.apiKey}` } : {},
      body: fd,
    });
    if (!res.ok) { console.warn(TAG, 'STT HTTP', res.status); return; }
    const data = await res.json();
    const text = (data?.text || '').trim();
    if (text) chrome.runtime.sendMessage({ type: 'stt-result', text }).catch(() => {});
  } catch (e) {
    console.warn(TAG, 'STT fetch failed', e);
  }
}
