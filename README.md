# Meet Live Coach

Extensão para Google Chrome (Manifest V3) que funciona como **live coach de vendas** durante chamadas no Google Meet. Toda vez que detecta uma chamada, ela:

1. **Transcreve** o que é dito pelos participantes, **separando por canal/falante**.
2. **Dá dicas em tempo real** conforme um **playbook de vendas** que você anexa, usando um LLM compatível com a OpenAI.

A extensão é 100% local no navegador — nenhuma informação sai do seu Chrome além das chamadas que você configura para o seu próprio provedor de LLM.

## Como funciona

- **Participantes remotos:** a extensão lê as **legendas nativas do Google Meet** (ative o CC na chamada). As legendas nativas já vêm com o nome do falante, então cada participante vira um "canal" na transcrição.
- **Sua própria voz (canal "You"):** opcional, capturada pelo microfone via `SpeechRecognition` do navegador (Web Speech API).
- **Coaching:** em intervalos configuráveis, a transcrição recente é enviada ao LLM junto com o seu playbook, e a dica aparece na aba **Coach** do painel.

> Não usamos `tabCapture`/offscreen porque a `SpeechRecognition` do Chrome não consegue transcrever um `MediaStream` arbitrário — ela usa o microfone. As legendas nativas do Meet são a fonte mais confiável para os remotos e já trazem a separação por falante.

## Instalação (modo desenvolvedor)

1. Baixe/clonar este repositório.
2. Abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto (a que contém o `manifest.json`).
5. Fixe o ícone da extensão na barra.

## Uso

1. Abra uma chamada em `https://meet.google.com/...`.
2. **Ative as legendas (CC)** no Meet — botão CC na barra inferior.
3. O painel "Meet Live Coach" aparece à direita. Se quiser incluir sua própria voz, clique em **Iniciar** no popup da extensão (isso dispara a permissão de microfone).
4. Acompanhe a transcrição na aba **Transcrição** e as dicas na aba **Coach**.

## Configuração (página de Opções)

Clique no ícone da extensão → **Opções** (ou botão "Opções" no popup).

- **Captura:** auto-início, captura de microfone, idiomas das legendas e do microfone.
- **Coach (LLM):**
  - **Endpoint** OpenAI-compatible. Exemplos:
    - OpenAI: `https://api.openai.com/v1/chat/completions`
    - Groq: `https://api.groq.com/openai/v1/chat/completions`
    - OpenRouter: `https://openrouter.ai/api/v1/chat/completions`
  - **Modelo** (ex.: `gpt-4o-mini`, `llama-3.3-70b-versatile`).
  - **API Key** (deixe vazio se o endpoint não exigir).
  - **Intervalo** entre análises (segundos).
- **Playbook de vendas:** cole o texto do seu playbook. Ele é enviado como contexto a cada análise.

## Estrutura do projeto

```
manifest.json
icons/                  # ícones da extensão
src/
  background/service-worker.js   # defaults + relay de mensagens
  content/
    meet-coach.js       # núcleo: legendas, mic, coaching, overlay
    meet-coach.css      # estilos do overlay
  popup/                # popup de controle
  options/              # página de opções (playbook + LLM)
```

## Referências

Arquitetura inspirada em projetos open-source do GitHub:
- [recallai/Chrome-recording-transcription-extension](https://github.com/recallai/Chrome-recording-transcription-extension) — MV3 + leitura das legendas do Meet.
- [sughodke/google-meet-transcripts](https://github.com/sughodke/google-meet-transcripts) — parser das legendas nativas com nome do falante.
- [yunho0130/google-meet-cc-to-srt](https://github.com/yunho0130/google-meet-cc-to-srt) — per-speaker state tracking.

## Limitações

- A separação por falante depende das legendas do Google Meet, que dependem de a call ter o CC ativo e de o Meet identificar o falante.
- A `SpeechRecognition` funciona apenas no Chrome/Edge (não no Firefox).
- Os seletores de DOM das legendas do Meet mudam entre versões; o parser usa heurísticas resilientes, mas pode precisar de ajuste se o Meet mudar a estrutura.
- O reconhecimento de voz local não transcreve o áudio dos outros participantes — apenas o seu microfone. Para os remotos, usamos as legendas nativas.

## Licença

MIT
