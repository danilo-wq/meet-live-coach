// Background service worker. The content script does the heavy lifting
// (DOM caption reading + local mic recognition + LLM calls). This worker
// owns defaults, relays control messages for the popup/options UI, and
// coordinates the offscreen document used for tab-audio STT.

const TAG = '[meet-coach:sw]';
const OFFSCREEN_URL = 'src/offscreen/offscreen.html';
let offscreenReady = false;

const DEFAULT_SETTINGS = {
  autoStart: true,
  captureMic: true,
  micLang: 'pt-BR',
  captionLang: 'pt-BR',
  coachingEnabled: true,
  coachingIntervalSeconds: 30,
  llmEndpoint: 'https://api.minimaxi.chat/v1/chat/completions',
  llmApiKey: '',
  llmModel: 'MiniMax-Text-01',
  playbook: '',
  sttEnabled: false,
  sttEndpoint: 'http://localhost:8080/v1/audio/transcriptions',
  sttModel: '',
  sttApiKey: '',
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
  if (msg?.type === 'start-tab-stt') {
    (async () => {
      try {
        await ensureOffscreen();
        const tabId = _sender.tab?.id;
        const streamId = await getStreamIdForTab(tabId);
        await chrome.runtime.sendMessage({
          type: 'offscreen:start-tab',
          streamId,
          sttEndpoint: msg.sttEndpoint,
          sttModel: msg.sttModel,
          sttApiKey: msg.sttApiKey,
        });
        sendResponse({ ok: true });
      } catch (e) {
        console.warn(TAG, 'start-tab-stt failed', e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }
  if (msg?.type === 'stop-tab-stt') {
    chrome.runtime.sendMessage({ type: 'offscreen:stop' }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

async function hasOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  return contexts.length > 0;
}

async function ensureOffscreen() {
  if (offscreenReady && (await hasOffscreen())) return;
  if (offscreenReady) offscreenReady = false;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'],
    justification: 'Capture Meet tab audio to transcribe participants via a local Whisper endpoint.',
  });
  offscreenReady = true;
}

function getStreamIdForTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => resolve(streamId));
  });
}

void TAG;

