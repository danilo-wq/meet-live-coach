const KEYS = [
  'autoStart', 'captureMic', 'micLang', 'captionLang',
  'coachingEnabled', 'coachingIntervalSeconds', 'llmEndpoint', 'llmApiKey',
  'llmModel', 'playbook',
  'sttEnabled', 'sttEndpoint', 'sttModel', 'sttApiKey',
];

// Playbook GGV embutido — enviado ao LLM em cada análise de coaching.
const GGV_PLAYBOOK = `# Consultor Comercial Sênior — Metodologia GGV (Live Coach)

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

const PRESETS = {
  'whisper-cpp': { sttEndpoint: 'http://localhost:8080/v1/audio/transcriptions', sttModel: '' },
  'faster-whisper': { sttEndpoint: 'http://localhost:8000/v1/audio/transcriptions', sttModel: 'whisper-large-v3' },
  'ollama': { sttEndpoint: 'http://localhost:11434/v1/audio/transcriptions', sttModel: 'whisper' },
  'minimax': { llmEndpoint: 'https://api.minimaxi.chat/v1/chat/completions', llmModel: 'MiniMax-Text-01' },
  'ollama-llm': { llmEndpoint: 'http://localhost:11434/v1/chat/completions', llmModel: 'llama3.1' },
  'openai': { llmEndpoint: 'https://api.openai.com/v1/chat/completions', llmModel: 'gpt-4o-mini' },
};

const DEFAULTS = {
  autoStart: true, captureMic: true, micLang: 'pt-BR', captionLang: 'pt-BR',
  coachingEnabled: true, coachingIntervalSeconds: 30,
  llmEndpoint: 'https://api.minimaxi.chat/v1/chat/completions',
  llmApiKey: '', llmModel: 'MiniMax-Text-01',
  playbook: GGV_PLAYBOOK,
  sttEnabled: false,
  sttEndpoint: 'http://localhost:8080/v1/audio/transcriptions',
  sttModel: '', sttApiKey: '',
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
  document.getElementById('playbookPreview').textContent = GGV_PLAYBOOK;
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  for (const [k, v] of Object.entries(p)) {
    const el = document.getElementById(k);
    if (el) el.value = v;
  }
  const saved = document.getElementById('saved');
  saved.textContent = 'Preset aplicado';
  saved.classList.add('show');
  setTimeout(() => { saved.classList.remove('show'); saved.textContent = 'Salvo!'; }, 1200);
}

async function save() {
  const s = {};
  for (const k of KEYS) {
    const el = document.getElementById(k);
    if (!el) continue;
    s[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
  }
  if (!s.playbook || !s.playbook.trim()) s.playbook = GGV_PLAYBOOK;
  await chrome.storage.local.set({ settings: s });
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
});
document.querySelectorAll('.preset button').forEach((b) =>
  b.addEventListener('click', () => applyPreset(b.dataset.preset)));

document.addEventListener('DOMContentLoaded', load);
