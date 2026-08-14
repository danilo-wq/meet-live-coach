const $ = (id) => document.getElementById(id);
let activeTab = null;

async function getActiveMeetTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const t = tabs[0];
  if (t && /^https:\/\/meet\.google\.com\//.test(t.url || '')) return t;
  // Fall back to any open Meet tab.
  const all = await chrome.tabs.query({ url: 'https://meet.google.com/*' });
  return all[0] || null;
}

async function refreshStatus() {
  activeTab = await getActiveMeetTab();
  if (!activeTab) {
    $('dot').classList.remove('on');
    $('statusText').textContent = 'Nenhuma aba do Google Meet aberta';
    $('startBtn').disabled = true; $('stopBtn').disabled = true; $('collapseBtn').disabled = true;
    $('counts').textContent = '';
    setMsg('Abra uma chamada no <a href="https://meet.google.com" target="_blank">meet.google.com</a> e depois volte aqui.', true);
    return;
  }
  $('startBtn').disabled = false; $('stopBtn').disabled = false; $('collapseBtn').disabled = false;
  chrome.tabs.sendMessage(activeTab.id, { type: 'get-state' }, (res) => {
    if (chrome.runtime.lastError || !res) {
      $('dot').classList.remove('on');
      $('statusText').textContent = 'Extensão não ativa nesta aba';
      $('counts').textContent = '';
      setMsg('Recarregue a aba do Meet se o painel não apareceu.', true);
      return;
    }
    $('dot').classList.toggle('on', !!res.running);
    $('statusText').textContent = res.running ? 'Capturando' : 'Parado';
    $('counts').textContent = `${res.transcriptLen || 0} falas · ${res.tipsLen || 0} dicas`;
  });
}

function sendToTab(type, done) {
  if (!activeTab) return;
  chrome.tabs.sendMessage(activeTab.id, { type }, () => { if (chrome.runtime.lastError) setMsg('Aba do Meet não respondeu. Recarregue-a.', true); done?.(); });
}

function setMsg(text, warn) {
  $('msg').innerHTML = warn ? `<div class="warn">${text}</div>` : `<div class="ok">${text}</div>`;
}

$('startBtn').addEventListener('click', () => sendToTab('start', () => setTimeout(refreshStatus, 200)));
$('stopBtn').addEventListener('click', () => sendToTab('stop', () => setTimeout(refreshStatus, 200)));
$('collapseBtn').addEventListener('click', () => sendToTab('toggle-collapse'));
$('optsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());

document.addEventListener('DOMContentLoaded', refreshStatus);
