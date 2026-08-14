# Meet Live Coach — GGV

Extensao para Google Chrome (Manifest V3) que funciona como **live coach de vendas** durante chamadas no Google Meet, na identidade visual do **Grupo GGV**. Toda vez que detecta uma chamada, ela:

1. **Transcreve** o que e dito pelos participantes, **separando por canal/falante**.
2. **Da dicas em tempo real** conforme o **playbook de vendas** do tipo de reuniao, usando um LLM (MiniMax, Ollama local, OpenAI, etc.).

## Identidade GGV (fundo claro)

Interface de fundo claro/branco com fontes e acentos nas cores GGV (`#002060` navy / `#33279B` azul / `#00BA8A` teal / `#00D38B` menta), fonte **Montserrat** e logos oficiais. Veja `identidade-ggv.md`.

## Canais de transcricao

| Canal | Origem | Como ativar |
|---|---|---|
| Participantes remotos | Legendas nativas do Google Meet (com nome do falante) | Ative o CC na chamada |
| **You** | Seu microfone (Web Speech API) | Options -> Capturar microfone |
| **Tab** | Audio da aba transcrito por **Whisper local/cloud** | Options -> STT |

## Controles durante a call

No topo do painel, durante a chamada, voce tem:
- **Parar transcricao** / **Parar coach** (pausam independentemente)
- **Seletor de tipo de reuniao** (escolhe o playbook ativo) ou **Selecao automatica** (a IA escolhe pelo transcript)

## Provedores (tela de selecao)

Na pagina de Opcoes voce escolhe o provedor por cartoes:

**LLM (Coach):** MiniMax, OpenAI, Groq, OpenRouter, Together, Ollama (local) ou Personalizado.
**STT (audio da aba):** whisper.cpp, faster-whisper, Ollama (local), OpenAI Whisper API, Groq Whisper ou Personalizado.

Ao clicar no provedor, endpoint e modelo sao preenchidos automaticamente. Voce so cola a API key (quando aplicavel).

## Playbooks por tipo de reuniao

- Cadastre **multiplos playbooks** (Descoberta, Demo, Fechamento, Negociacao...).
- Cada playbook tem **nome, resumo curto e texto**, com **limite de 4.000 caracteres** (contador em tempo real).
- O resumo e usado pela selecao automatica para a IA escolher o playbook certo.
- Um playbook "Descoberta (padrao)" ja vem cadastrado; o playbook GGV completo fica como referencia.

## Instalacao (modo desenvolvedor)

1. Baixe/clone o repositorio.
2. `chrome://extensions` -> ative o **Modo do desenvolvedor**.
3. **Carregar sem compactacao** -> selecione a pasta com o `manifest.json`.

## Uso

1. Abra uma chamada em `https://meet.google.com/...`.
2. **Ative as legendas (CC)** no Meet.
3. O painel aparece a direita (auto-start). Para incluir sua voz, clique em **Iniciar** no popup.
4. No painel, escolha o tipo de reuniao (ou automatico) e use os botoes de pausar transcricao/coach.

## Configuracao (Options)

1. **Captura**: auto-inicio, microfone, idiomas.
2. **Provedor do LLM**: cartoes (MiniMax/OpenAI/Groq/OpenRouter/Together/Ollama/Personalizado) + API key.
3. **Provedor de STT**: cartoes (whisper.cpp/faster-whisper/Ollama/OpenAI/Groq/Personalizado) + endpoint.
4. **Playbooks**: cadastre/edite/exclua playbooks por tipo de reuniao, com limite de caracteres.

## Estrutura do projeto

```
manifest.json
icons/                          # icones GGV (navy/teal)
src/
  background/service-worker.js  # defaults + offscreen/tabCapture
  content/meet-coach.{js,css}   # nucleo: legendas, mic, STT-tab, coaching, overlay + controles
  offscreen/offscreen.js        # captura audio da aba -> Whisper
  popup/                        # controle (iniciar/parar/recolher)
  options/                      # config: provedores, playbooks, captura
playbook-ggv.md                 # playbook de vendas completo (referencia)
identidade-ggv.md               # identidade visual GGV (referencia)
```

## Limitacoes

- A separacao por falante depende das legendas do Google Meet identificarem o falante.
- A `SpeechRecognition` (mic) funciona apenas no Chrome/Edge.
- O canal "Tab" via Whisper depende do seu servidor STT estar rodando e aceitar webm/opus.
- Seletores de DOM das legendas do Meet mudam entre versoes; o parser usa heuristicas resilientes.

## Licenca

MIT
