// Background service worker. The content script does the heavy lifting
// (DOM caption reading + local mic recognition + LLM calls). This worker
// owns defaults and relays a few control messages for the popup/options UI.

const TAG = '[meet-coach:sw]';

const DEFAULT_SETTINGS = {
  autoStart: true,
  captureMic: true,
  micLang: 'pt-BR',
  captionLang: 'pt-BR',
  coachingEnabled: true,
  coachingIntervalSeconds: 30,
  llmEndpoint: '',            // e.g. https://api.openai.com/v1/chat/completions
  llmApiKey: '',
  llmModel: 'gpt-4o-mini',
  playbook: '',               // sales playbook text pasted by the user
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['settings'], ({ settings }) => {
    if (!settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'get-settings') {
    chrome.storage.local.get(['settings'], ({ settings = {} }) => {
      sendResponse({ settings: { ...DEFAULT_SETTINGS, ...settings } });
    });
    return true;
  }
  if (msg?.type === 'ping') {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

void TAG;

