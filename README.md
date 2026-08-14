# Meet Live Coach — GGV

Extensão para Google Chrome (Manifest V3) que funciona como **live coach de vendas** durante chamadas no Google Meet, na identidade visual do **Grupo GGV**. Toda vez que detecta uma chamada, ela:

1. **Transcreve** o que é dito pelos participantes, **separando por canal/falante**.
2. **Dá dicas em tempo real** conforme o **playbook de vendas GGV**, usando um LLM (MiniMax, Ollama local, OpenAI, etc.).

## Identidade GGV

A interface usa a paleta oficial (`#002060` navy / `#33279B` azul / `#00BA8A` teal / `#00D38B` menta), fonte **Montserrat**, logos oficiais via URL e a faixa de rodapé com gradiente. Veja `identidade-ggv.md` para a referência completa.

## Canais de transcrição

| Canal | Origem | Como ativar |
|---|---|---|
| Participantes remotos | Legendas nativas do Google Meet (com nome do falante) | Ative o CC na chamada |
| **You** | Seu microfone (Web Speech API) | Options → "Capturar meu microfone" |
| **Tab** | Áudio da aba transcrito por seu **Whisper local** (Ollama/whisper.cpp/faster-whisper) | Options → "STT local" |

## Instalação (modo desenvolvedor)

1. Baixe/clonar este repositório.
2. `chrome://extensions` → ative o **Modo do desenvolvedor**.
3. **Carregar sem compactação** → selecione a pasta com o `manifest.json`.

## Uso

1. Abra uma chamada em `https://meet.google.com/...`.
2. **Ative as legendas (CC)** no Meet.
3. O painel aparece à direita (auto-start). Para incluir sua voz, clique em **Iniciar** no popup.
4. Aba **Transcrição** = canais; aba **Coach** = dicas.

## Configuração (Options)

### LLM (Coach) — já vem pré-configurado para MiniMax
- Endpoint, modelo e API key. Botões de preset: **MiniMax**, **Ollama (LLM local)**, **OpenAI**.
- MiniMax: `https://api.minimaxi.chat/v1/chat/completions`, modelo `MiniMax-Text-01`.
- Ollama: `http://localhost:11434/v1/chat/completions` (rode `ollama serve`).
- Cole sua API key do MiniMax no campo correspondente.

### STT local (Whisper / Ollama) — áudio da aba
- Ative a transcrição do áudio da aba via seu Whisper local.
- Endpoint no formato OpenAI `/v1/audio/transcriptions`.
- Presets: whisper.cpp (localhost:8080), faster-whisper-server (localhost:8000), Ollama (localhost:11434).
- Exemplo com whisper.cpp: `./server -m ggml-large-v3.bin --port 8080`.

### Playbook de vendas
- Já vem preenchido com a **metodologia GGV** (condensada para coaching ao vivo).
- O playbook completo de referência está em `playbook-ggv.md`.

## Estrutura do projeto

```
manifest.json
icons/                          # icones GGV (navy/teal)
src/
  background/service-worker.js  # defaults + offscreen/tabCapture coordination
  content/meet-coach.{js,css}   # nucleo: legendas, mic, STT-tab, coaching, overlay
  offscreen/offscreen.js        # captura audio da aba -> Whisper local
  popup/                        # controle (iniciar/parar/recolher)
  options/                      # config: LLM, STT, playbook
playbook-ggv.md                 # playbook de vendas completo (referencia)
identidade-ggv.md               # identidade visual GGV (referencia)
```

## Limitações

- A separação por falante depende das legendas do Google Meet identificarem o falante.
- A `SpeechRecognition` (mic) funciona apenas no Chrome/Edge.
- O canal "Tab" via Whisper local depende do seu servidor STT estar rodando e aceitar webm/opus.
- Seletores de DOM das legendas do Meet mudam entre versões; o parser usa heurísticas resilientes.

## Licença

MIT
