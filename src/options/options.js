// ---- Settings schema ----------------------------------------------------
const PB_CHAR_LIMIT = 4000;

const KEYS = [
  'autoStart', 'captureMic', 'micLang', 'captionLang',
  'coachingEnabled', 'coachingIntervalSeconds', 'llmEndpoint', 'llmApiKey',
  'llmModel', 'llmProvider',
  'sttEnabled', 'sttEndpoint', 'sttModel', 'sttApiKey', 'sttProvider',
  'playbooks', 'activePlaybook',
];

// Playbook GGV embutido — referência + um playbook padrão cadastrado.
const GGV_PLAYBOOK_REF = `# Consultor Comercial Sênior — Metodologia GGV (Live Coach)

Você é um live coach de vendas operando pela metodologia GGV, escutando uma call em tempo real. Responda em português brasileiro, tom profissional, técnico e direto. Nunca use gerúndio. Nunca faça promessa absoluta. Nunca invente dado.

## Como responder (máx. 3 bullets curtos e acionáveis)
- Aponte em qual parte do funil (topo/meio/fundo/gestão) a call está agora e a próxima pergunta a fazer.
- Sinalize objeção não tratada ou etapa do playbook pulada (BANT/SPIN, fechamento).
- Sugira a próxima ação concreta do vendedor para avançar a venda.

## Motor do funil (diagnóstico)
- TOPO (pouco lead) → ICP + Canais de Vendas
- MEIO (lead não vira oportunidade) → Scripts Comerciais (SPIN/BANT)
- FUNDO (não fecha) → Fechamento + contorno de objeções
- GESTÃO (imprevisível) → Funil + CRM

## Regras de ouro
- Priorize sprint pela leitura do funil, não por preferência do cliente.
- Questione a premissa antes de aceitar a narrativa.
- Verifique capacidade de entrega antes de acelerar topo.
- Sem número → Planejamento Comercial vem primeiro.

## Vocabulário GGV
- Use "assessoria", nunca "consultoria".
- Prova social: "+2.000 empresas em 36 segmentos".
- Evite "representante"/"representação comercial" (Lei 4.886/65) — use "time comercial", "equipe de vendas".

## CTAs e marca
- CTA: "Conversar com especialista".
- Promessa: "Resultado e Ponto".

Use o transcript abaixo para contextualizar. Se faltar informação, indique a pergunta a fazer.`;

const DEFAULT_PLAYBOOK_TEXT = `# Descoberta — Primeira call (BANT/SPIN)

Objetivo: entender dores, qualificar e agendar próximo passo.

## Etapas
1. Abertura: confirme contexto e tempo em 30s
2. Situação (SPIN): como opera hoje, ferramentas, time
3. Problema (SPIN): qual o maior gargalo? impacta o quê?
4. Implicação (SPIN): o que acontece se não resolver? custo disso?
5. Necessidade (SPIN): como seria o ideal? o que resolveria agora?
6. BANT: Budget, Authority, Need, Timeline
7. Encerramento: resuma dor + próximos passos com data

## Gatilhos de objeção
- "Caro" → ROI em N meses
- "Sem tempo" → quick win em 2 semanas
- "Já usamos X" → comparativo de resultado

## Coaching
- Se pular qualificação, peça BANT antes de apresentar
- Se o cliente falar mais que o vendedor, sinalize
- Sempre confirme próximos passos com data`;

// ---- Providers ---------------------------------------------------------
const LLM_PROVIDERS = [
  { id: 'minimax', emoji: '🟣', name: 'MiniMax', tag: 'Cloud', endpoint: 'https://api.minimaxi.chat/v1/chat/completions', model: 'MiniMax-Text-01', needsKey: true },
  { id: 'openai', emoji: '🟢', name: 'OpenAI', tag: 'Cloud', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', needsKey: true },
  { id: 'groq', emoji: '⚡', name: 'Groq', tag: 'Cloud', endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', needsKey: true },
  { id: 'openrouter', emoji: '🔗', name: 'OpenRouter', tag: 'Cloud', endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini', needsKey: true },
  { id: 'together', emoji: '🤝', name: 'Together', tag: 'Cloud', endpoint: 'https://api.together.ai/v1/chat/completions', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', needsKey: true },
  { id: 'ollama', emoji: '🦙', name: 'Ollama', tag: 'Local', endpoint: 'http://localhost:11434/v1/chat/completions', model: 'llama3.1', needsKey: false },
  { id: 'custom', emoji: '⚙️', name: 'Personalizado', tag: 'Avançado', endpoint: '', model: '', needsKey: false },
];

const STT_PROVIDERS = [
  { id: 'whisper-cpp', emoji: '🎙️', name: 'whisper.cpp', tag: 'Local', endpoint: 'http://localhost:8080/v1/audio/transcriptions', model: '' },
  { id: 'faster-whisper', emoji: '⚡', name: 'faster-whisper', tag: 'Local', endpoint: 'http://localhost:8000/v1/audio/transcriptions', model: 'whisper-large-v3' },
  { id: 'ollama', emoji: '🦙', name: 'Ollama', tag: 'Local', endpoint: 'http://localhost:11434/v1/audio/transcriptions', model: 'whisper' },
  { id: 'openai-stt', emoji: '🟢', name: 'OpenAI Whisper API', tag: 'Cloud', endpoint: 'https://api.openai.com/v1/audio/transcriptions', model: 'whisper-1' },
  { id: 'groq-stt', emoji: '⚡', name: 'Groq Whisper', tag: 'Cloud', endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions', model: 'whisper-large-v3' },
  { id: 'custom-stt', emoji: '⚙️', name: 'Personalizado', tag: 'Avançado', endpoint: '', model: '' },
];

const DEFAULTS = {
  autoStart: true, captureMic: true, micLang: 'pt-BR', captionLang: 'pt-BR',
  coachingEnabled: true, coachingIntervalSeconds: 30,
  llmProvider: 'minimax',
  llmEndpoint: 'https://api.minimaxi.chat/v1/chat/completions',
  llmApiKey: '', llmModel: 'MiniMax-Text-01',
  sttProvider: 'whisper-cpp',
  sttEnabled: false,
  sttEndpoint: 'http://localhost:8080/v1/audio/transcriptions',
  sttModel: '', sttApiKey: '',
  playbooks: [
    { id: 'pb-default', name: 'Descoberta (padrão)', summary: 'Primeira call para entender dores e qualificar (BANT)', text: DEFAULT_PLAYBOOK_TEXT },
  ],
  activePlaybook: 'auto',
};

let cachedSettings = { ...DEFAULTS };
let editingPlaybookId = null;

// ---- Load / Save -------------------------------------------------------
async function load() {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  cachedSettings = { ...DEFAULTS, ...settings };
  const s = cachedSettings;
  // simple fields
  for (const k of ['autoStart','captureMic','coachingEnabled','sttEnabled']) {
    const el = document.getElementById(k); if (el) el.checked = !!s[k];
  }
  for (const k of ['micLang','captionLang','llmEndpoint','llmApiKey','llmModel','llmProvider','sttEndpoint','sttModel','sttApiKey','sttProvider','coachingIntervalSeconds']) {
    const el = document.getElementById(k); if (el) el.value = s[k] ?? '';
  }
  renderProviders('llmProviders', LLM_PROVIDERS, s.llmProvider);
  renderProviders('sttProviders', STT_PROVIDERS, s.sttProvider);
  document.getElementById('playbookPreview').textContent = GGV_PLAYBOOK_REF;
  renderPlaybookList();
}

function renderProviders(containerId, providers, selectedId) {
  const c = document.getElementById(containerId);
  const key = containerId === 'llmProviders' ? 'llmProvider' : 'sttProvider';
  const endpointId = containerId === 'llmProviders' ? 'llmEndpoint' : 'sttEndpoint';
  const modelId = containerId === 'llmProviders' ? 'llmModel' : 'sttModel';
  c.innerHTML = '';
  providers.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'provider-card' + (p.id === selectedId ? ' selected' : '');
    card.innerHTML = `<span class="pc-emoji">${p.emoji}</span><span class="pc-name">${p.name}</span><span class="pc-tag">${p.tag}</span>`;
    card.addEventListener('click', () => {
      cachedSettings[key] = p.id;
      if (p.endpoint) document.getElementById(endpointId).value = p.endpoint;
      if (p.model) document.getElementById(modelId).value = p.model;
      renderProviders(containerId, providers, p.id);
    });
    c.appendChild(card);
  });
}

// ---- Playbooks manager --------------------------------------------------
function renderPlaybookList() {
  const list = document.getElementById('pbList');
  list.innerHTML = '';
  const pbs = cachedSettings.playbooks || [];
  if (pbs.length === 0) {
    list.innerHTML = '<div class="pb-empty">Nenhum playbook cadastrado. Clique em "+ Novo playbook".</div>';
    return;
  }
  pbs.forEach((pb) => {
    const row = document.createElement('div');
    row.className = 'pb-row' + (cachedSettings.activePlaybook === pb.id ? ' active' : '');
    row.innerHTML = `<span class="pb-name">${escapeHtml(pb.name)}</span><span class="pb-chars">${pb.text.length}/${PB_CHAR_LIMIT}</span>`;
    row.querySelector('.pb-name').addEventListener('click', () => openPlaybookEditor(pb.id));
    list.appendChild(row);
  });
}

function openPlaybookEditor(id) {
  editingPlaybookId = id;
  const editor = document.getElementById('pbEditor');
  editor.style.display = 'block';
  const pb = id ? cachedSettings.playbooks.find((p) => p.id === id) : null;
  document.getElementById('pbEditorTitle').textContent = pb ? 'Editar playbook' : 'Novo playbook';
  document.getElementById('pbId').value = id || '';
  document.getElementById('pbName').value = pb?.name || '';
  document.getElementById('pbSummary').value = pb?.summary || '';
  document.getElementById('pbText').value = pb?.text || '';
  document.getElementById('pbDelete').style.display = pb ? 'inline-block' : 'none';
  updateCharCount();
  document.getElementById('pbName').focus();
}

function closePlaybookEditor() {
  document.getElementById('pbEditor').style.display = 'none';
  editingPlaybookId = null;
}

function savePlaybookFromEditor() {
  const id = document.getElementById('pbId').value || ('pb-' + Date.now());
  const name = document.getElementById('pbName').value.trim();
  const summary = document.getElementById('pbSummary').value.trim();
  const text = document.getElementById('pbText').value;
  if (!name) { alert('Informe o nome do tipo de reunião.'); return; }
  if (text.length > PB_CHAR_LIMIT) { alert(`O playbook excede o limite de ${PB_CHAR_LIMIT} caracteres (atual: ${text.length}).`); return; }
  const pbs = cachedSettings.playbooks || [];
  const idx = pbs.findIndex((p) => p.id === id);
  const entry = { id, name, summary, text };
  if (idx >= 0) pbs[idx] = entry; else pbs.push(entry);
  cachedSettings.playbooks = pbs;
  renderPlaybookList();
  closePlaybookEditor();
  flashSaved('Playbook salvo (lembre de Salvar configuração)');
}

function deletePlaybookFromEditor() {
  const id = document.getElementById('pbId').value;
  if (!id) return;
  if (!confirm('Excluir este playbook?')) return;
  cachedSettings.playbooks = (cachedSettings.playbooks || []).filter((p) => p.id !== id);
  if (cachedSettings.activePlaybook === id) cachedSettings.activePlaybook = 'auto';
  renderPlaybookList();
  closePlaybookEditor();
}

function updateCharCount() {
  const text = document.getElementById('pbText').value;
  const el = document.getElementById('pbCharCount');
  el.textContent = `${text.length} / ${PB_CHAR_LIMIT}`;
  el.classList.toggle('warn', text.length > PB_CHAR_LIMIT * 0.8 && text.length <= PB_CHAR_LIMIT);
  el.classList.toggle('over', text.length > PB_CHAR_LIMIT);
}

async function save() {
  const s = { ...cachedSettings };
  // read simple fields back
  for (const k of ['autoStart','captureMic','coachingEnabled','sttEnabled']) {
    const el = document.getElementById(k); if (el) s[k] = el.checked;
  }
  for (const k of ['micLang','captionLang','llmEndpoint','llmApiKey','llmModel','llmProvider','sttEndpoint','sttModel','sttApiKey','sttProvider']) {
    const el = document.getElementById(k); if (el) s[k] = el.value;
  }
  s.coachingIntervalSeconds = Number(document.getElementById('coachingIntervalSeconds').value) || 30;
  await chrome.storage.local.set({ settings: s });
  cachedSettings = s;
  const tabs = await chrome.tabs.query({ url: 'https://meet.google.com/*' });
  for (const t of tabs) chrome.tabs.sendMessage(t.id, { type: 'settings-updated' }, () => void chrome.runtime.lastError);
  flashSaved('Salvo!');
}

function flashSaved(text) {
  const saved = document.getElementById('saved');
  saved.textContent = text;
  saved.classList.add('show');
  setTimeout(() => saved.classList.remove('show'), 1800);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---- Wire up ------------------------------------------------------------
document.getElementById('save').addEventListener('click', save);
document.getElementById('reset').addEventListener('click', async () => {
  if (!confirm('Restaurar todos os padrões? Seus playbooks e configurações serão substituídos.')) return;
  await chrome.storage.local.set({ settings: DEFAULTS });
  await load();
});
document.getElementById('pbNew').addEventListener('click', () => openPlaybookEditor(null));
document.getElementById('pbSave').addEventListener('click', savePlaybookFromEditor);
document.getElementById('pbCancel').addEventListener('click', closePlaybookEditor);
document.getElementById('pbDelete').addEventListener('click', deletePlaybookFromEditor);
document.getElementById('pbText').addEventListener('input', updateCharCount);

document.addEventListener('DOMContentLoaded', load);
