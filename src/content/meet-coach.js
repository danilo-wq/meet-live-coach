/* Meet Live Coach — content script.
 *
 * Responsibilities:
 *  - Detect an active Google Meet call and auto-start.
 *  - Read the meeting's native closed captions from the DOM (these already
 *    carry the remote speaker's name) and stream them into a per-speaker
 *    transcript.
 *  - Run a local SpeechRecognition on the microphone so the local user's
 *    own voice ("You") becomes a channel too.
 *  - Periodically ask an OpenAI-compatible LLM for live sales coaching,
 *    grounded in the user's playbook.
 *  - Render an overlay panel with a Transcript tab and a Coach tab.
 *
 * All runtime extension APIs are read through `chrome.runtime`/`chrome.storage`
 * from this ISOLATED-world content script. SpeechRecognition runs directly
 * here (it requires a user-gesture page context, which a content script on
 * the page satisfies once the user has interacted with the Meet tab).
 */

(() => {
  'use strict';

  const TAG = '[meet-coach]';
  const MEET_CALL_HINT = 'https://meet.google.com/';

  // ---- State -------------------------------------------------------------
  const state = {
    settings: null,
    running: false,
    collapsed: false,
    activeTab: 'transcript', // 'transcript' | 'coach'
    captionContainer: null,
    captionObserver: null,
    seenSpeakers: new Set(),
    transcript: [],          // { speaker, text, ts, source }
    tips: [],                // { text, ts }
    lastCoachAt: 0,
    micRecognizer: null,
    micRestartTimer: null,
    micActive: false,
    tabSttActive: false,
    sttStatus: null,        // { state: 'active'|'error'|'idle', detail }
    youCurrentText: '',
    youLastEmit: 0,
    // Runtime controls (independent of global settings)
    transcriptionPaused: false,
    coachingPaused: false,
    meetingType: 'auto',    // 'auto' | id of a saved playbook
  };

  // ---- Settings ----------------------------------------------------------
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'get-settings' }, (res) => {
        resolve(res?.settings || null);
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'settings-updated') {
      loadSettings().then((s) => { state.settings = s; applySettingsSideEffects(); });
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === 'start') { start(); sendResponse({ ok: true }); return true; }
    if (msg?.type === 'stop') { stop(); sendResponse({ ok: true }); return true; }
    if (msg?.type === 'restart') {
      stop();
      setTimeout(() => { start(); sendResponse({ ok: true }); }, 250);
      return true;
    }
    if (msg?.type === 'toggle-collapse') { toggleCollapse(); sendResponse({ ok: true }); return true; }
    if (msg?.type === 'get-state') {
      sendResponse({ running: state.running, transcriptLen: state.transcript.length, tipsLen: state.tips.length });
      return true;
    }
    if (msg?.type === 'stt-result') {
      // Transcribed tab audio -> "Tab" channel.
      if (msg.text) appendTranscript('Tab', msg.text, 'tab');
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === 'stt-status') {
      state.sttStatus = msg; // { state: 'active'|'error', detail }
      renderSttStatus();
      sendResponse({ ok: true });
      return true;
    }
    return false;
  });

  function applySettingsSideEffects() {
    const s = state.settings;
    if (!s) return;
    refreshMeetingTypeOptions();
    if (state.running) {
      if (s.captureMic && !state.micActive) startMic();
      if (!s.captureMic && state.micActive) stopMic();
      if (s.sttEnabled && s.sttEndpoint && !state.tabSttActive) startTabStt();
      if ((!s.sttEnabled || !s.sttEndpoint) && state.tabSttActive) stopTabStt();
      scheduleCoaching(true);
    }
  }

  // ---- Lifecycle ---------------------------------------------------------
  async function maybeStart() {
    if (!location.href.startsWith(MEET_CALL_HINT)) return;
    state.settings = await loadSettings();
    if (!state.settings?.autoStart) return;
    if (state.running) return;
    start();
  }

  function start() {
    if (state.running) return;
    state.running = true;
    state.transcript = [];
    state.tips = [];
    state.lastCoachAt = 0;
    mountOverlay();
    startCaptionCapture();
    if (state.settings?.captureMic) startMic();
    if (state.settings?.sttEnabled && state.settings?.sttEndpoint) startTabStt();
    scheduleCoaching(true);
    setHeaderStatus(true);
    console.log(TAG, 'started');
  }

  function stop() {
    if (!state.running) return;
    state.running = false;
    if (state.captionObserver) state.captionObserver.disconnect();
    state.captionObserver = null;
    state.captionContainer = null;
    captionCardCache.forEach((e) => e.debounce && clearTimeout(e.debounce));
    captionCardCache.clear();
    captionsEnableTries = 0;
    stopMic();
    stopTabStt();
    setHeaderStatus(false);
    console.log(TAG, 'stopped');
  }

  // ---- Tab audio STT (Whisper / Ollama local) ---------------------------
  function startTabStt() {
    const s = state.settings;
    if (!s || !s.sttEnabled || !s.sttEndpoint || state.tabSttActive) return;
    state.tabSttActive = true;
    state.sttStatus = { state: 'idle', detail: 'iniciando captura da aba' };
    renderSttStatus();
    chrome.runtime.sendMessage({
      type: 'start-tab-stt',
      sttEndpoint: s.sttEndpoint,
      sttModel: s.sttModel,
      sttApiKey: s.sttApiKey,
    }, (res) => {
      if (chrome.runtime.lastError || !res?.ok) {
        console.warn(TAG, 'tab STT start failed', chrome.runtime.lastError, res);
        state.tabSttActive = false;
        state.sttStatus = { state: 'error', detail: res?.error || 'falha ao iniciar captura da aba' };
        renderSttStatus();
      } else {
        console.log(TAG, 'tab STT started ->', s.sttEndpoint);
      }
    });
  }

  function stopTabStt() {
    if (!state.tabSttActive) return;
    state.tabSttActive = false;
    chrome.runtime.sendMessage({ type: 'stop-tab-stt' }, () => void chrome.runtime.lastError);
  }

  // ---- Caption capture (remote speakers) --------------------------------
  // Google Meet renders live captions as per-speaker "cards" near the bottom
  // of the screen. The DOM class names change often, so we locate the
  // captions container by a geometry/structure heuristic (avatar images from
  // googleusercontent grouped by class, lowest-common-ancestor, centered or
  // bottom-left aligned) — the approach used by proven open-source Meet
  // transcript extensions. We then observe that container and track each card
  // with a trailing debounce so a speaker's evolving utterance is captured
  // once (finalized) instead of duplicated.

  const captionCardCache = new Map(); // node -> { person, text, debounce }

  function getCaptionData(node) {
    // Speaker name = a direct text node inside a child div (Meet renders the
    // name as bare text, not in a span). XPath keeps it robust to class churn.
    let person = 'Participante';
    try {
      const it = document.evaluate('.//div/text()', node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
      let n;
      while ((n = it.iterateNext())) {
        const t = (n.textContent || '').trim();
        if (t && t.length < 60) { person = t; break; }
      }
    } catch {}

    // Utterance text = concatenation of leaf spans (matches Meet's layout).
    const spans = Array.from(node.querySelectorAll('span')).filter((s) => s.children.length === 0);
    let text = spans.map((s) => (s.textContent || '').trim()).join(' ').trim();
    if (!text) text = (node.textContent || '').trim();
    return { person, text };
  }

  // Find the real closed-captions container via avatar-image grouping + geometry.
  function findCaptionContainer() {
    const imgs = Array.from(document.querySelectorAll('img')).filter((i) =>
      /googleusercontent\.com\//.test(i.src || '')
    );
    if (imgs.length === 0) return null;

    const byClass = {};
    for (const img of imgs) {
      const key = img.className || '__noclass__';
      (byClass[key] = byClass[key] || []).push(img);
    }

    const candidates = [];
    for (const classNodes of Object.values(byClass)) {
      // Every node in the group must have a nearby leaf span with real text.
      let matches = 0;
      for (const node of classNodes) {
        const spans = document.evaluate(`..//span`, node.parentElement, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
        let s;
        while ((s = spans.iterateNext())) {
          if (s.children.length === 0 && (s.textContent || '').trim().length > 3) { matches++; break; }
        }
      }
      if (matches !== classNodes.length) continue;

      // Lowest common ancestor of the grouped nodes.
      let candidate = null;
      if (classNodes.length >= 2) {
        const copy = classNodes.slice();
        let current = null, ok = true;
        do {
          for (let i = 0; i < copy.length; i++) {
            copy[i] = copy[i].parentElement;
            if (!copy[i]) { ok = false; break; }
            if (i === 0) current = copy[i];
            else if (current && current !== copy[i]) current = null;
          }
        } while (current === null && ok);
        candidate = current;
      } else {
        let n = classNodes[0];
        while (n && !candidate) {
          if (n.getAttribute && n.getAttribute('jscontroller')) candidate = n;
          n = n.parentElement;
        }
      }
      if (!candidate) continue;

      // Geometry check: captions are centered near the bottom, or bottom-left,
      // spanning ~60% width — this rejects participant tiles.
      const child = candidate.children[0];
      if (!child) continue;
      const rect = child.getBoundingClientRect();
      const W = window.innerWidth;
      const isLeftAligned = rect.left < W * 0.2;
      const isNotRightAligned = rect.right < W * 0.9;
      const isWiderThanHalf = rect.right > W * 0.5;
      const nearBottom = rect.bottom > window.innerHeight * 0.45;
      if (nearBottom && ((isLeftAligned && isNotRightAligned && isWiderThanHalf))) {
        candidates.push(candidate);
      }
    }
    return candidates.length >= 1 ? candidates[0] : null;
  }

  function processCaptionCard(node) {
    if (!node || !state.running) return;
    const { person, text } = getCaptionData(node);
    if (!text) return;
    let entry = captionCardCache.get(node);
    if (!entry) {
      entry = { person, text, debounce: null };
      captionCardCache.set(node, entry);
      // Emit immediately so the line appears without delay.
      appendTranscript(person, text, 'caption');
    }
    // Trailing debounce: re-read the (possibly extended) text once it settles.
    if (entry.debounce) clearTimeout(entry.debounce);
    entry.debounce = setTimeout(() => {
      const fresh = getCaptionData(node);
      entry.person = fresh.person;
      entry.text = fresh.text;
      appendTranscript(fresh.person, fresh.text, 'caption');
      entry.debounce = null;
    }, 1200);
  }

  function pollCaptionsOnce() {
    const container = state.captionContainer;
    if (!container) return;
    // Each direct card is a child block holding one speaker's avatar + text.
    const cards = container.querySelectorAll('img');
    const seen = new Set();
    for (const img of cards) {
      if (!/googleusercontent\.com\//.test(img.src || '')) continue;
      const card = img.closest('div[jscontroller]') || img.parentElement?.parentElement || img.parentElement;
      if (!card || seen.has(card)) continue;
      seen.add(card);
      processCaptionCard(card);
    }
    // Prune cache for removed nodes.
    for (const key of captionCardCache.keys()) {
      if (!document.contains(key)) { captionCardCache.delete(key); }
    }
  }

  let captionPollTimer = null;
  function startCaptionCapture() {
    if (captionPollTimer) clearInterval(captionPollTimer);
    captionPollTimer = setInterval(pollCaptionsOnce, 1000);
    attachCaptionObserver();
    if (state._attachInterval) clearInterval(state._attachInterval);
    state._attachInterval = setInterval(attachCaptionObserver, 2000);
    // Try to ensure captions are ON (best-effort; user may need to enable CC).
    tryEnableCaptions();
  }

  function attachCaptionObserver() {
    if (!state.running) return;
    if (state.captionContainer && document.contains(state.captionContainer)) return;
    const container = findCaptionContainer();
    if (container) {
      state.captionContainer = container;
      if (!state.captionObserver) {
        state.captionObserver = new MutationObserver(() => pollCaptionsOnce());
      }
      state.captionObserver.observe(container, { childList: true, subtree: true, characterData: true });
    }
  }

  // Best-effort: click the "Turn on captions" / "Ativar legendas" control so
  // the caption stream exists. Safe to call repeatedly; no-op if already on.
  let captionsEnableTries = 0;
  function tryEnableCaptions() {
    if (!state.running) return;
    if (captionsEnableTries > 8) return; // give up after ~16s
    captionsEnableTries++;
    const btn = findCaptionsButton();
    if (btn && /ativar|turn on|legendas|captions/i.test(btn.getAttribute('aria-label') || '')) {
      try { btn.click(); } catch {}
    }
    setTimeout(tryEnableCaptions, 2000);
  }

  function findCaptionsButton() {
    // Meet's captions toggle lives in the bottom control bar.
    const candidates = document.querySelectorAll('[aria-label]');
    for (const el of candidates) {
      const label = (el.getAttribute('aria-label') || '').toLowerCase();
      if (/ativar legendas|desativar legendas|turn on captions|turn off captions|legendas|captions/.test(label)) {
        if (el.closest('button') || el.getAttribute('role') === 'button' || el.tagName === 'BUTTON') return el;
      }
    }
    return null;
  }

  // ---- Local microphone channel ("You") ---------------------------------
  function startMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.warn(TAG, 'SpeechRecognition unavailable'); return; }
    stopMic();
    const r = new SR();
    r.lang = state.settings?.micLang || 'pt-BR';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) {
          emitYouUtterance(txt.trim());
          state.youCurrentText = '';
        } else {
          interim += txt;
        }
      }
      state.youCurrentText = interim;
    };
    r.onerror = (e) => { console.warn(TAG, 'mic error', e.error); };
    r.onend = () => {
      state.micActive = false;
      // Auto-restart while running (Chrome stops recognition after silence).
      if (state.running && state.settings?.captureMic) {
        clearTimeout(state.micRestartTimer);
        state.micRestartTimer = setTimeout(() => {
          if (!state.running || !state.settings?.captureMic) return;
          try { r.start(); state.micActive = true; } catch {}
        }, 400);
      }
    };
    try { r.start(); state.micActive = true; state.micRecognizer = r; }
    catch (e) { console.warn(TAG, 'mic start failed', e); }
  }

  function stopMic() {
    clearTimeout(state.micRestartTimer);
    if (state.micRecognizer) {
      try { state.micRecognizer.onresult = null; state.micRecognizer.onend = null; state.micRecognizer.stop(); } catch {}
      state.micRecognizer = null;
    }
    state.micActive = false;
    if (state.youCurrentText) { emitYouUtterance(state.youCurrentText.trim()); state.youCurrentText = ''; }
  }

  function emitYouUtterance(text) {
    if (!text) return;
    const now = Date.now();
    // Merge short consecutive local utterances (<1.5s gap) into one line.
    if (now - state.youLastEmit < 1500 && state.transcript.length &&
        state.transcript[state.transcript.length - 1].speaker === 'You') {
      const last = state.transcript[state.transcript.length - 1];
      last.text = `${last.text} ${text}`.trim();
      last.ts = now;
      renderTranscriptUpdate(last, 'update');
    } else {
      appendTranscript('You', text, 'mic');
      state.youLastEmit = now;
    }
  }

  // ---- Transcript store --------------------------------------------------
  // Dedup similar caption text per speaker within a short window to avoid
  // duplicating partial captions that Google emits incrementally.
  function appendTranscript(speaker, text, source) {
    if (state.transcriptionPaused) return; // runtime pause
    const norm = normalizeText(text);
    if (!norm) return;
    const last = state.transcript[state.transcript.length - 1];
    // Only attempt to merge caption fragments from the same speaker within a
    // short window (Meet replaces a card's text as the utterance evolves).
    if (last && last.speaker === speaker && source === 'caption' && (Date.now() - last.ts) < 8000) {
      // Meet shows an evolving utterance in the same card: the card text grows
      // (and sometimes reformats slightly). Merge when the new text is the same,
      // a superset, or a near-superset of the previous line for this speaker.
      if (norm === last._norm) return;          // identical -> drop
      if (last._norm && norm.startsWith(last._norm)) {
        last.text = text; last._norm = norm; last.ts = Date.now();
        renderTranscriptUpdate(last, 'update');
        return;
      }
      // Previous line is a prefix of the new one (Meet appended words).
      if (last._norm && last._norm.startsWith(norm)) return;
      // Word-level overlap: if the new line contains the whole previous line,
      // treat as an extension and replace (avoids duplicate fragments).
      if (last._norm && norm.includes(last._norm)) {
        last.text = text; last._norm = norm; last.ts = Date.now();
        renderTranscriptUpdate(last, 'update');
        return;
      }
    }
    const entry = { speaker: speaker || 'Participante', text, ts: Date.now(), source, _norm: norm };
    state.transcript.push(entry);
    state.seenSpeakers.add(entry.speaker);
    renderTranscriptUpdate(entry, 'append');
  }

  function normalizeText(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  // ---- Coaching ----------------------------------------------------------
  let coachingTimer = null;
  function scheduleCoaching(immediate = false) {
    clearTimeout(coachingTimer);
    const s = state.settings;
    if (!s || !s.coachingEnabled || !s.llmEndpoint) return;
    if (state.coachingPaused) return; // runtime pause
    const interval = Math.max(5, s.coachingIntervalSeconds || 30) * 1000;
    coachingTimer = setTimeout(runCoaching, immediate ? 1500 : interval);
  }

  // Resolve the playbook text for the current meeting type. 'auto' lets the
  // LLM choose based on the transcript; otherwise the saved playbook is used.
  function resolvePlaybook() {
    const s = state.settings;
    const playbooks = s?.playbooks || [];
    if (state.meetingType !== 'auto') {
      const pb = playbooks.find((p) => p.id === state.meetingType);
      if (pb) return { type: pb.name, text: pb.text };
    }
    // Auto: send all playbook names + the default GGV one as a guide.
    const list = playbooks.map((p) => `- ${p.name}: ${p.summary || p.text.slice(0, 80)}`).join('\n');
    return { type: 'automático', text: list ? `Escolha automaticamente o tipo de reunião entre:\n${list}` : '' };
  }

  async function runCoaching() {
    const s = state.settings;
    if (!s || !s.coachingEnabled || !s.llmEndpoint) return;
    if (state.coachingPaused) return;
    const now = Date.now();
    const windowMs = Math.max(30000, (s.coachingIntervalSeconds || 30) * 1000 * 3);
    const recent = state.transcript.filter((t) => now - t.ts < windowMs);
    if (recent.length === 0) { scheduleCoaching(false); return; }

    const transcriptText = recent.map((t) => `${t.speaker}: ${t.text}`).join('\n');
    const { type, text: playbookText } = resolvePlaybook();

    const system = [
      'Você é um live coach de vendas em tempo real durante uma call no Google Meet.',
      'Analise a transcrição parcial e dê dicas curtas, acionáveis e específicas',
      'com base no playbook de vendas fornecido. Seja direto, no máximo 3 bullets.',
      'Não invente informações que não estejam no transcript. Se faltar contexto,',
      'indique a próxima pergunta ou etapa do playbook a explorar.',
      `\nTipo de reunião (contexto): ${type}.`,
      playbookText ? `\n--- PLAYBOOK DE VENDAS ---\n${playbookText}\n--- FIM DO PLAYBOOK ---` : '',
    ].join(' ');

    const body = {
      model: s.llmModel,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Transcrição recente:\n${transcriptText}` },
      ],
    };

    try {
      const res = await fetch(s.llmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(s.llmApiKey ? { Authorization: `Bearer ${s.llmApiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const data = await res.json();
      const tip = data?.choices?.[0]?.message?.content?.trim();
      if (tip) {
        const entry = { text: tip, ts: Date.now() };
        state.tips.push(entry);
        renderTip(entry);
      }
    } catch (e) {
      console.warn(TAG, 'coaching failed', e);
    } finally {
      state.lastCoachAt = Date.now();
      scheduleCoaching(false);
    }
  }

  // ---- Overlay UI --------------------------------------------------------
  let els = null;

  function mountOverlay() {
    if (document.getElementById('mc-root')) return;
    const root = document.createElement('div');
    root.id = 'mc-root';
    root.className = 'mc-root';
    root.innerHTML = `
      <div class="mc-header">
        <div class="mc-title">
          <img class="mc-logo" alt="GGV" src="https://ggvinteligencia.com.br/wp-content/uploads/2025/08/Logo-GGV-Padrao.png" />
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="mc-dot idle"></span>
          <button class="mc-iconbtn" data-act="tab" title="Alternar Transcrição/Coach">⇄</button>
          <button class="mc-iconbtn" data-act="collapse" title="Recolher painel">–</button>
        </div>
      </div>
      <div class="mc-controls">
        <select class="mc-meeting-select" id="mc-meeting-type" title="Tipo de reunião / playbook"></select>
        <button class="mc-ctrl-btn" id="mc-pause-transcript" title="Pausar/retomar transcrição">▶ Transcrição</button>
        <button class="mc-ctrl-btn" id="mc-pause-coach" title="Pausar/retomar coach">▶ Coach</button>
      </div>
      <div class="mc-tabs">
        <div class="mc-tab active" data-tab="transcript">Transcrição</div>
        <div class="mc-tab" data-tab="coach">Coach</div>
      </div>
      <div class="mc-body"></div>
      <div class="mc-stt-detail" id="mc-stt-detail"></div>
      <div class="mc-footer">
        <div class="mc-status"><span class="mc-dot idle"></span> <span class="mc-status-text">Parado</span></div>
        <span class="mc-stt-badge" id="mc-stt-badge" title="Status da transcrição por áudio da aba">Áudio da aba: off</span>
        <span class="mc-count">0 falas</span>
      </div>
      <div class="mc-resizer" id="mc-resizer" title="Arraste o canto para redimensionar"></div>
    `;
    document.body.appendChild(root);

    els = {
      root,
      body: root.querySelector('.mc-body'),
      dot: root.querySelector('.mc-header .mc-dot'),
      statusDot: root.querySelector('.mc-status .mc-dot'),
      statusText: root.querySelector('.mc-status-text'),
      count: root.querySelector('.mc-count'),
      tabs: Array.from(root.querySelectorAll('.mc-tab')),
      meetingSelect: root.querySelector('#mc-meeting-type'),
      sttBadge: root.querySelector('#mc-stt-badge'),
      sttDetail: root.querySelector('#mc-stt-detail'),
      pauseTranscriptBtn: root.querySelector('#mc-pause-transcript'),
      pauseCoachBtn: root.querySelector('#mc-pause-coach'),
    };

    els.tabs.forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
    root.querySelector('[data-act="tab"]').addEventListener('click', () =>
      switchTab(state.activeTab === 'transcript' ? 'coach' : 'transcript'));
    root.querySelector('[data-act="collapse"]').addEventListener('click', toggleCollapse);
    els.meetingSelect.addEventListener('change', () => {
      state.meetingType = els.meetingSelect.value;
      scheduleCoaching(true);
    });
    els.pauseTranscriptBtn.addEventListener('click', () => {
      state.transcriptionPaused = !state.transcriptionPaused;
      els.pauseTranscriptBtn.textContent = state.transcriptionPaused ? '⏸ Transcrição' : '▶ Transcrição';
      els.pauseTranscriptBtn.classList.toggle('active', state.transcriptionPaused);
      els.pauseTranscriptBtn.classList.toggle('danger', state.transcriptionPaused);
      updateStatusText();
    });
    els.pauseCoachBtn.addEventListener('click', () => {
      state.coachingPaused = !state.coachingPaused;
      els.pauseCoachBtn.textContent = state.coachingPaused ? '⏸ Coach' : '▶ Coach';
      els.pauseCoachBtn.classList.toggle('active', state.coachingPaused);
      els.pauseCoachBtn.classList.toggle('danger', state.coachingPaused);
      if (!state.coachingPaused) scheduleCoaching(true);
      else clearTimeout(coachingTimer);
      updateStatusText();
    });

    // Restore saved size
    try {
      const w = localStorage.getItem('mc-width');
      const h = localStorage.getItem('mc-height');
      if (w) els.root.style.width = `${Math.max(300, Math.min(720, Number(w)))}px`;
      if (h) els.root.style.height = `${Math.max(360, Math.min(window.innerHeight - 40, Number(h)))}px`;
    } catch {}

    // Drag panel by header (skip if clicking a button/select)
    const header = root.querySelector('.mc-header');
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, select, .mc-meeting-select')) return;
      e.preventDefault();
      const panel = els.root;
      const startX = e.clientX - panel.offsetLeft;
      const startY = e.clientY - panel.offsetTop;
      const onMove = (ev) => {
        let nx = ev.clientX - startX;
        let ny = ev.clientY - startY;
        nx = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, nx));
        ny = Math.max(0, Math.min(window.innerHeight - 40, ny));
        panel.style.left = `${nx}px`;
        panel.style.top = `${ny}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      };
      const onUp = () => {
        try {
          localStorage.setItem('mc-left', panel.style.left);
          localStorage.setItem('mc-top', panel.style.top);
        } catch {}
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Restore saved position
    try {
      const l = localStorage.getItem('mc-left');
      const t = localStorage.getItem('mc-top');
      if (l && t) {
        els.root.style.left = l;
        els.root.style.top = t;
        els.root.style.right = 'auto';
        els.root.style.bottom = 'auto';
      }
    } catch {}

    // Resize handle drag (bottom-right corner)
    const resizer = root.querySelector('#mc-resizer');
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.root.classList.add('resizing');
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = els.root.offsetWidth;
      const startH = els.root.offsetHeight;
      const onMove = (ev) => {
        const newW = Math.max(300, Math.min(720, startW + (ev.clientX - startX)));
        const newH = Math.max(360, Math.min(window.innerHeight - 40, startH + (ev.clientY - startY)));
        els.root.style.width = `${newW}px`;
        els.root.style.height = `${newH}px`;
      };
      const onUp = () => {
        els.root.classList.remove('resizing');
        try {
          localStorage.setItem('mc-width', els.root.offsetWidth);
          localStorage.setItem('mc-height', els.root.offsetHeight);
        } catch {}
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    refreshMeetingTypeOptions();
    renderTranscriptFull();
    renderCoachFull();
    switchTab('transcript');
  }

  // Populate the meeting-type dropdown from saved playbooks.
  function refreshMeetingTypeOptions() {
    if (!els) return;
    const playbooks = state.settings?.playbooks || [];
    const opts = ['<option value="auto">🤖 Seleção automática</option>']
      .concat(playbooks.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`));
    els.meetingSelect.innerHTML = opts.join('');
    els.meetingSelect.value = state.meetingType;
  }

  function toggleCollapse() {
    state.collapsed = !state.collapsed;
    if (!els) return;
    // Use a class toggle (CSS !important) instead of inline display, because
    // .mc-root sets display:flex !important which would override inline none.
    els.root.classList.toggle('mc-hidden', state.collapsed);
    const existing = document.getElementById('mc-fab');
    if (state.collapsed) {
      if (!existing) {
        const fab = document.createElement('div');
        fab.className = 'mc-collapsed';
        fab.id = 'mc-fab';
        fab.textContent = '🎤';
        fab.title = 'Abrir Meet Live Coach';
        fab.addEventListener('click', toggleCollapse);
        document.body.appendChild(fab);
      }
    } else {
      existing?.remove();
    }
  }

  function setHeaderStatus(active) {
    if (!els) return;
    els.dot.classList.toggle('idle', !active);
    els.statusDot.classList.toggle('idle', !active);
    updateStatusText();
  }

  // Reflect runtime pause states in the overlay status text.
  function updateStatusText() {
    if (!els) return;
    if (!state.running) { els.statusText.textContent = 'Parado'; return; }
    if (state.transcriptionPaused && state.coachingPaused) {
      els.statusText.textContent = 'Pausado (transcrição e coach)';
    } else if (state.transcriptionPaused) {
      els.statusText.textContent = 'Gravando coach · transcrição pausada';
    } else if (state.coachingPaused) {
      els.statusText.textContent = 'Gravando transcrição · coach pausado';
    } else {
      els.statusText.textContent = 'Gravando';
    }
    renderSttStatus();
  }

  // Show whether tab-audio STT is running / healthy / erroring in the footer.
  function renderSttStatus() {
    if (!els || !els.sttBadge) return;
    const sttOn = !!(state.settings?.sttEnabled && state.settings?.sttEndpoint);
    const b = els.sttBadge;
    b.classList.remove('ok', 'err', 'off');

    // Visible detail line above footer
    const d = els.sttDetail;
    if (d) d.className = 'mc-stt-detail';

    if (!sttOn) {
      b.textContent = 'Áudio da aba: off';
      b.title = 'STT da aba desativado. Ative nas Opções.';
      b.classList.add('off');
      if (d) d.style.display = 'none';
      return;
    }
    if (!state.running) {
      b.textContent = 'Áudio da aba: off';
      b.classList.add('off');
      if (d) d.style.display = 'none';
      return;
    }

    const st = state.sttStatus;
    if (st?.state === 'active') {
      b.textContent = 'Áudio da aba: ativo';
      b.title = 'Transcrevendo áudio da aba — ' + (st.detail || 'ok');
      b.classList.add('ok');
      if (d) { d.style.display = 'none'; d.textContent = ''; }
    } else if (st?.state === 'error') {
      b.textContent = 'Áudio da aba: erro';
      b.title = 'Erro no STT: ' + (st.detail || 'desconhecido');
      b.classList.add('err');
      if (d) {
        d.style.display = 'block';
        d.textContent = '⚠ ' + (st.detail || 'erro desconhecido');
        d.className = 'mc-stt-detail err';
      }
    } else {
      b.textContent = 'Áudio da aba: aguardando…';
      b.title = st?.detail || 'iniciando captura da aba';
      b.classList.add('off');
      if (d) {
        d.style.display = 'block';
        d.textContent = '⏳ ' + (st?.detail || 'iniciando captura da aba…');
        d.className = 'mc-stt-detail wait';
      }
    }
  }

  function switchTab(tab) {
    state.activeTab = tab;
    if (!els) return;
    els.tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'transcript') { renderTranscriptFull(); els.body.scrollTop = els.body.scrollHeight; }
    else renderCoachFull();
  }

  function renderTranscriptFull() {
    if (!els || state.activeTab !== 'transcript') return;
    els.body.innerHTML = `<div class="mc-transcript">${state.transcript.map(msgHtml).join('')}</div>` + (state.transcript.length ? '' : `<div class="mc-empty">A transcrição aparece aqui quando as legendas do Meet ou seu microfone estiverem ativos.</div>`);
    updateCount();
  }

  function renderTranscriptUpdate(entry, mode) {
    if (!els || state.activeTab !== 'transcript') return;
    const wrap = els.body.querySelector('.mc-transcript');
    if (!wrap) { renderTranscriptFull(); return; }
    if (mode === 'update') {
      const existing = wrap.querySelector(`[data-id="${entry.ts}"]`) || wrap.lastElementChild;
      if (existing) { existing.outerHTML = msgHtml(entry); updateCount(); return; }
    }
    // Remove empty placeholder if present.
    els.body.querySelector('.mc-empty')?.remove();
    wrap.insertAdjacentHTML('beforeend', msgHtml(entry));
    els.body.scrollTop = els.body.scrollHeight;
    updateCount();
  }

  function renderCoachFull() {
    if (!els || state.activeTab !== 'coach') return;
    els.body.innerHTML = `<div class="mc-coach">${state.tips.map(tipHtml).join('')}</div>` + (state.tips.length ? '' : `<div class="mc-empty">As dicas do coach aparecem aqui. Configure o LLM e o playbook de vendas nas opções da extensão.</div>`);
  }

  function renderTip(entry) {
    if (!els || state.activeTab !== 'coach') return;
    const wrap = els.body.querySelector('.mc-coach');
    if (!wrap) { renderCoachFull(); return; }
    els.body.querySelector('.mc-empty')?.remove();
    wrap.insertAdjacentHTML('afterbegin', tipHtml(entry));
  }

  function msgHtml(entry) {
    const isYou = entry.speaker === 'You';
    return `<div class="mc-msg${isYou ? ' you' : ''}" data-id="${entry.ts}">
      <div class="mc-msg-meta"><span class="mc-speaker${isYou ? ' you' : ''}">${escapeHtml(entry.speaker)}</span><span>${fmtTime(entry.ts)}</span></div>
      <div class="mc-text">${escapeHtml(entry.text)}</div>
    </div>`;
  }

  function tipHtml(entry) {
    return `<div class="mc-tip"><div class="mc-tip-head">Dica · ${fmtTime(entry.ts)}</div><div class="mc-tip-body">${escapeHtml(entry.text)}</div></div>`;
  }

  function updateCount() { if (els) els.count.textContent = `${state.transcript.length} falas`; }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }

  // ---- Boot --------------------------------------------------------------
  function boot() {
    // Only run on actual call URLs (skip landing page). A Meet call URL looks
    // like https://meet.google.com/xxx-xxxx-xxx.
    const isCall = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(location.href);
    if (!isCall) {
      // Wait until the user enters a call.
      const obs = new MutationObserver(() => {
        if (/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(location.href)) {
          obs.disconnect();
          maybeStart();
        }
      });
      const root = document.body || document.documentElement;
      if (root) obs.observe(root, { childList: true, subtree: true });
      setTimeout(() => obs.disconnect(), 60000);
      return;
    }
    maybeStart();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    window.addEventListener('DOMContentLoaded', boot, { once: true });
  }
})();
