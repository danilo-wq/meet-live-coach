const KEYS = [
  'autoStart', 'captureMic', 'micLang', 'captionLang',
  'coachingEnabled', 'coachingIntervalSeconds', 'llmEndpoint', 'llmApiKey',
  'llmModel', 'playbook',
];

const DEFAULTS = {
  autoStart: true, captureMic: true, micLang: 'pt-BR', captionLang: 'pt-BR',
  coachingEnabled: true, coachingIntervalSeconds: 30, llmEndpoint: '',
  llmApiKey: '', llmModel: 'gpt-4o-mini', playbook: '',
};

async function load() {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  const s = { ...DEFAULTS, ...settings };
  for (const k of KEYS) {
    const el = document.getElementById(k);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = !!s[k];
    else el.value = s[k] ?? '';
  }
}

async function save() {
  const s = {};
  for (const k of KEYS) {
    const el = document.getElementById(k);
    if (!el) continue;
    s[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
  }
  await chrome.storage.local.set({ settings: s });
  // Tell every Meet tab to reload settings.
  const tabs = await chrome.tabs.query({ url: 'https://meet.google.com/*' });
  for (const t of tabs) {
    chrome.tabs.sendMessage(t.id, { type: 'settings-updated' }, () => void chrome.runtime.lastError);
  }
  const saved = document.getElementById('saved');
  saved.classList.add('show');
  setTimeout(() => saved.classList.remove('show'), 1600);
}

document.getElementById('save').addEventListener('click', save);
document.getElementById('reset').addEventListener('click', async () => {
  await chrome.storage.local.set({ settings: DEFAULTS });
  await load();
  save();
});

document.addEventListener('DOMContentLoaded', load);
