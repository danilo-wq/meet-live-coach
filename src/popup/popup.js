const $ = (id) => document.getElementById(id);
let activeTab = null;

function setStatus(state, text) {
  const badge = $('statusBadge');
  badge.classList.remove('recording', 'stopped', 'waiting');
  badge.classList.add(state);
  $('statusText').textContent = text;
}

async function getActiveMeetTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const t = tabs[0];
  if (t && /^https:\/\/meet\.google\.com\//.test(t.url || '')) return t;
  const all = await chrome.tabs.query({ url: 'https://meet.google.com/*' });
  return all[0] || null;
}

async function refreshStatus() {
  activeTab = await getActiveMeetTab();
  if (!activeTab) {
    setStatus('waiting', 'Nenhum Meet aberto');
    $('startBtn').disabled = true; $('stopBtn').disabled = true; $('restartBtn').disabled = true; $('collapseBtn').disabled = true;
    $('counts').textContent = '';
    setMsg('Abra uma chamada no <a href="https://meet.google.com" target="_blank">meet.google.com</a> e depois volte aqui.', true);
    return;
  }
  $('startBtn').disabled = false; $('stopBtn').disabled = false; $('restartBtn').disabled = false; $('collapseBtn').disabled = false;
  chrome.tabs.sendMessage(activeTab.id, { type: 'get-state' }, (res) => {
    if (chrome.runtime.lastError || !res) {
      setStatus('waiting', 'Extensão inativa');
      $('counts').textContent = '';
      setMsg('Recarregue a aba do Meet se o painel não apareceu.', true);
      return;
    }
    if (res.running) setStatus('recording', 'Gravando');
    else setStatus('stopped', 'Parado');
    $('counts').textContent = `${res.transcriptLen || 0} falas · ${res.tipsLen || 0} dicas`;
  });
}

function sendToTab(type, done) {
  if (!activeTab) return;
  chrome.tabs.sendMessage(activeTab.id, { type }, () => { if (chrome.runtime.lastError) setMsg('Aba do Meet não respondeu. Recarregue-a.', true); done?.(); });
}

// tabCapture.getMediaStreamId requires a user gesture + activeTab grant.
// The popup's button click IS that gesture, so we obtain the streamId here
// and hand it to the service worker (which forwards to the offscreen doc).
function getStreamIdForTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else if (!streamId) reject(new Error('streamId vazio (tabCapture negado)'));
      else resolve(streamId);
    });
  });
}

async function startTabSttWithGesture() {
  if (!activeTab) return;
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'get-settings' });
    const s = settings?.settings || {};
    if (!s.sttEnabled || !s.sttEndpoint) return; // STT disabled, nothing to do
    // Stop any existing capture first — Chrome rejects getMediaStreamId with
    // "Cannot capture a tab with an active stream" if a prior stream is live.
    await chrome.runtime.sendMessage({ type: 'stop-tab-stt' }).catch(() => {});
    // Give the offscreen document time to release the MediaStream tracks.
    await new Promise((r) => setTimeout(r, 400));
    const streamId = await getStreamIdForTab(activeTab.id);
    await chrome.runtime.sendMessage({
      type: 'start-tab-stt',
      streamId,
      sttEndpoint: s.sttEndpoint,
      sttModel: s.sttModel,
      sttApiKey: s.sttApiKey,
    });
  } catch (e) {
    setMsg('Áudio da aba: ' + (e?.message || e), true);
  }
}

function setMsg(text, warn) {
  $('msg').innerHTML = warn ? `<div class="warn">${text}</div>` : `<div class="ok">${text}</div>`;
}

$('startBtn').addEventListener('click', () => {
  setStatus('waiting', 'Iniciando…');
  sendToTab('start', () => {
    // Start tab-audio STT within the user-gesture context (this click).
    startTabSttWithGesture();
    setTimeout(refreshStatus, 300);
  });
});
$('stopBtn').addEventListener('click', () => { setStatus('waiting', 'Parando…'); sendToTab('stop', () => setTimeout(refreshStatus, 300)); });
$('restartBtn').addEventListener('click', () => {
  if (!confirm('Reiniciar limpa a transcrição e as dicas e recomeça a captura. Continuar?')) return;
  setStatus('waiting', 'Reiniciando…');
  sendToTab('restart', () => {
    startTabSttWithGesture();
    setTimeout(refreshStatus, 400);
  });
});
$('collapseBtn').addEventListener('click', () => sendToTab('toggle-collapse'));
$('optsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());

document.addEventListener('DOMContentLoaded', refreshStatus);
