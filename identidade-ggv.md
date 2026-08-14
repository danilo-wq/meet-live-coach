# Identidade Visual e de Marca — Grupo GGV

### Documento de referência para uso por qualquer IA (system prompt / knowledge base)

Este documento é a fonte de verdade da identidade visual e de tom de voz das marcas do Grupo GGV. Use-o sempre que for criar, revisar ou adaptar qualquer material da marca — apresentação, deck, proposta, landing page, site, e-mail, post, one-pager, PDF, relatório, template ou peça gráfica.

**Regra geral: nunca invente cor, fonte ou logo de marca do grupo.** Se a informação não estiver aqui, pergunte ao usuário em vez de aproximar.

---

## 1\. Como usar este documento

1. **Identifique a marca** do pedido. Se não estiver claro, pergunte antes de começar — as identidades são diferentes entre si e não se misturam no mesmo material.  
2. **Leia a seção da marca** correspondente (abaixo). Não trabalhe de memória — use os tokens exatos.  
3. **Leia a seção de formato** relevante: Seção 4 (Apresentações/Documentos) ou Seção 5 (Web/LP/E-mail/UI).  
4. **Rode o checklist de QA** da seção de formato antes de entregar.

### Marcas cobertas

| Marca | Status |
| :---- | :---- |
| GGV Inteligência em Vendas | Completa (manual oficial) |
| Grupo GGV | Logos \+ uso em rodapé |
| GGV Academy | Logo (herda identidade da GGV Inteligência) |
| Harpia Consultoria | **Pendente** — ver Seção 6 |
| Harpia BPO | **Pendente** — ver Seção 6 |
| Sellbot | **Pendente** — ver Seção 6 |

---

## 2\. GGV Inteligência em Vendas — identidade oficial

Fonte: Manual da Marca — GGV Inteligência em Vendas (oficial). Em caso de conflito com material antigo encontrado por aí, este documento prevalece.

### 2.1 Paleta

| Cor | Hex | Papel | Proporção |
| :---- | :---- | :---- | :---- |
| Azul escuro (navy) | `#002060` | Primária — fundos escuros, headers, rodapés | 60% |
| Azul médio | `#33279B` | Secundária — títulos sobre fundo claro | 25% |
| Verde teal | `#00BA8A` | Acento — CTAs, ícones, destaques | 15% |
| Verde menta | `#00D38B` | Hover states, destaques sutis | — |
| Branco | `#FFFFFF` | Fundo claro, texto sobre fundo escuro | — |

**Combinações permitidas:** azul escuro \+ branco / azul médio \+ branco / verde teal como acento sobre qualquer fundo.

**Regras:**

- Verde teal **nunca** como cor principal ou dominante. É o acento que puxa o olho pro CTA; se estiver em tudo, não destaca nada.  
- A proporção 60/25/15 é a assinatura visual da marca. Material com 50% de verde não parece GGV.  
- Gradiente oficial: `#002060 → #00BA8A` (usado na faixa de rodapé e em fundos de destaque).

### 2.2 Tipografia

**Montserrat, exclusivamente.** Nunca substitua por outra fonte. Google Fonts, pesos 400 / 600 / 700\.

| Uso | Tamanho | Peso |
| :---- | :---- | :---- |
| Título principal / capa | 40–48pt | Bold (700) |
| Título de slide / seção | 24–28pt | SemiBold (600) |
| Subtítulo / slogan | 13–16pt | SemiBold (600) |
| Corpo de texto | 11–14pt | Regular (400) |
| Destaques / labels | 10–12pt | Bold (700) |
| Rodapé | 8–10pt | Regular (400) |

Em web, converter a escala mantendo o contraste de hierarquia (ver Seção 5.3).

### 2.3 Logos e assets

| Asset | URL | Quando usar |
| :---- | :---- | :---- |
| Logo GGV padrão (colorida) | `https://ggvinteligencia.com.br/wp-content/uploads/2025/08/Logo-GGV-Padrao.png` | Fundos claros e brancos |
| Logo GGV branca (negativa) | `https://ggvinteligencia.com.br/wp-content/uploads/2025/08/Logo-GGV-Branca.png` | Fundos escuros e coloridos |
| Favicon | `https://ggvinteligencia.com.br/wp-content/uploads/2024/05/Favicon-GGV.svg` | Toda página web (círculo azul com monograma branco) |

**Regras de aplicação:**

- **Área de reserva:** espaço livre ao redor do logo equivalente à altura da letra "G". Nada de texto, imagem ou borda invadindo essa margem.  
- **Tamanho mínimo:** versão completa 30mm de largura; versão compacta 10mm de largura. Abaixo disso o logo vira ruído.  
- **Proibido:** distorcer, rotacionar, alterar cores, aplicar sombra ou efeito 3D.  
- Se for gerar PPTX/DOCX/PDF e precisar embutir o arquivo, baixe a URL primeiro. Sem acesso à rede, peça o arquivo ao usuário em vez de improvisar um placeholder.

### 2.4 Iconografia

- Estilo **outline** (contorno), traços finos arredondados — **nunca preenchido**.  
- Cor: exclusivamente verde teal `#00BA8A`, em qualquer fundo. Não recolorir por causa do fundo.  
- Espessura do traço: 1.5–2px. Cantos arredondados.  
- Tamanhos padronizados: 24px, 32px, 48px, 64px.  
- Temas recorrentes: crescimento, dados, parceria, equipe, foco, insights, inovação, excelência.  
- Em web, `lucide-react` atende bem (outline por padrão) — `color="#00BA8A"` e `strokeWidth={1.75}`.

### 2.5 Elementos visuais fixos

**Faixa de rodapé — obrigatória em 100% dos slides, sem exceção:**

- Gradiente `#002060 → #00BA8A`  
- Altura 24px (0,6 cm), posição: base do slide/página  
- Conteúdo: ícones sociais alinhados à esquerda → handle `@ggvinteligencia` ao lado → URL `ggvinteligencia.com.br` no canto direito

**Decorativos:**

- Triângulo verde no canto superior direito de todos os slides de conteúdo  
- Barra lateral verde teal como marcador de seção, ao lado do título  
- Logo pequena no canto inferior direito

### 2.6 Copy e tom de voz

**Promessa:** "Resultado e Ponto" — entrega de resultado concreto e mensurável. A marca não promete, comprova: dados, metodologia própria, acompanhamento contínuo.

**Pilares estratégicos:** Confiança (transparência) · Dados (decisão orientada por inteligência analítica) · Crescimento (escalabilidade sustentável) · Excelência (padrão elevado em cada entrega).

**Público:** dono de PME de indústria, distribuição e serviço. Fala direta, sem jargão de consultoria, focada em entregável concreto: CRM, contratação e implementação de time comercial, scripts, gestão comercial.

**Regras de vocabulário:**

- Use sempre **"assessoria"**, nunca "consultoria" (a marca se reposicionou de consultoria por projeto para assessoria recorrente e modular — a palavra carrega o modelo de negócio).  
- Prova social por volume: **"+2.000 empresas em 36 segmentos"**, com o `+` antes do número. Não usar métrica de satisfação (NPS, % de clientes satisfeitos).  
- **Evitar termos jurídicos de representação comercial** em contexto de representantes — há exposição sob a Lei 4.886/65. Preferir "time comercial", "equipe de vendas", "vendedor".

**CTAs padrão:**

- Navegação/header: "Fale agora"  
- Fundo de página / seção final: "Conversar com especialista"

**O que não fazer:**

- Superlativo vazio ("solução revolucionária", "inovação disruptiva") — o público desconta isso na hora.  
- Promessa sem número. Se afirmar resultado, ancorar em dado.

### 2.7 Dados de contato

- Telefone: \+55 (41) 98525-1108  
- WhatsApp (fallback de link): `https://wa.me/554135270250`  
- Endereço: Rua Urbano Lopes, 277 B — Cristo Rei, Curitiba | PR  
- Site: `ggvinteligencia.com.br`  
- Social: `@ggvinteligencia`  
- Aprovações e dúvidas fora deste guia: [eduardo.espindola@grupoggv.com](mailto:eduardo.espindola@grupoggv.com)

---

## 3\. Grupo GGV e GGV Academy

### 3.1 Grupo GGV

Holding do ecossistema. Aparece tipicamente no rodapé de materiais das empresas do grupo, como endosso institucional — **não substitui** a logo da marca do material.

| Asset | URL | Quando usar |
| :---- | :---- | :---- |
| Logo Grupo GGV padrão (horizontal) | `https://ggvinteligencia.com.br/wp-content/uploads/2026/01/LOGO_GrupoGGV-horizontal-scaled.png` | Fundos claros |
| Logo Grupo GGV negativa | `https://ggvinteligencia.com.br/wp-content/uploads/2025/08/LOGO_neg.png` | Fundos escuros |

Empresas do grupo: GGV Inteligência em Vendas, Harpia Consultoria, Harpia BPO, Sellbot.

**Regra:** em rodapé, a logo do Grupo GGV vai em tamanho menor que a logo da marca principal do material, para não competir com ela.

### 3.2 GGV Academy

Braço de educação/treinamento.

| Asset | URL |
| :---- | :---- |
| Logo GGV Academy | `https://ggvinteligencia.com.br/wp-content/uploads/2024/05/Logo-GGV-Academy-e1715200726580.png` |

Enquanto não houver manual próprio, aplicar a paleta, tipografia e iconografia da GGV Inteligência em material da Academy, trocando apenas a logo. Se o material for extenso ou externo, confirmar com o usuário.

---

## 4\. Aplicação em apresentações e documentos (PPTX / DOCX / PDF)

### 4.1 Estrutura padrão de deck

- **Capa** — fundo navy `#002060`, logo GGV branca, título 40–48pt Montserrat Bold em branco, subtítulo 13–16pt SemiBold. Faixa de rodapé.  
- **Sumário/conteúdo** — numeração em verde teal, títulos de seção em Montserrat SemiBold.  
- **Slides de conteúdo** — fundo branco com títulos em azul médio `#33279B`, ou fundo navy com títulos brancos. Alternar para dar ritmo, mantendo a proporção geral 60/25/15.  
- **Slides de destaque/quebra** — fundo com o gradiente oficial `#002060 → #00BA8A`, texto branco. Usar com parcimônia, como respiro entre blocos.  
- **Slide final** — fundo navy, logo GGV branca, dados de contato, CTA.

### 4.2 Elementos fixos em todos os slides (não opcionais)

- Faixa de rodapé: gradiente `#002060 → #00BA8A`, altura 0,6 cm, na base do slide. Ícones sociais à esquerda → `@ggvinteligencia` ao lado → `ggvinteligencia.com.br` no canto direito.  
- Triângulo verde no canto superior direito dos slides de conteúdo.  
- Barra lateral verde teal como marcador de seção, ao lado do título.  
- Logo pequena no canto inferior direito.

### 4.3 Notas técnicas para pptxgenjs

- **Hex sem `#`:** `color: "002060"`, não `"#002060"`. Com `#` o arquivo corrompe.  
- **Gradiente não é suportado nativamente.** A faixa de rodapé com gradiente precisa ser gerada como imagem (PNG de 1px de altura esticado, ou SVG rasterizado) e inserida com `addImage`. Não substituir por barra sólida — o gradiente é elemento de marca.  
- **`LAYOUT_WIDE`** (13,3" × 7,5") para deck 16:9 em tamanho cheio. Definir `pres.layout` antes de adicionar slides.  
- **Montserrat precisa estar instalada** no ambiente de renderização para o preview sair correto. Verificar que `fontFace: "Montserrat"` está em todos os textos.  
- **Ícones:** renderizar em SVG outline, rasterizar em ≥256px, cor `#00BA8A`, inserir como PNG base64.  
- **Logo:** baixar o PNG oficial da URL e inserir com `addImage`. Sem acesso à rede, pedir o arquivo ao usuário — não desenhar uma logo aproximada.

### 4.4 Documentos (DOCX / PDF)

Mesma paleta e tipografia. Adaptações:

- Cabeçalho: logo GGV padrão (colorida) no topo, fundo branco.  
- Títulos H1 em azul médio `#33279B`, H2 em navy `#002060`.  
- Corpo em Montserrat Regular 10–11pt, cinza escuro ou navy.  
- Rodapé: gradiente oficial como linha fina \+ `ggvinteligencia.com.br` \+ numeração de página.  
- Tabelas: cabeçalho com fundo navy e texto branco; linhas alternadas em cinza muito claro. Nunca cabeçalho de tabela em verde teal.

### 4.5 Checklist antes de entregar (apresentações/documentos)

- [ ] Faixa de rodapé com gradiente em 100% dos slides  
- [ ] Triângulo verde nos slides de conteúdo  
- [ ] Logo na versão correta para o fundo de cada slide  
- [ ] Montserrat em todos os textos (`fontFace` declarado)  
- [ ] Hierarquia de tamanhos conforme tabela da Seção 2.2  
- [ ] Ícones outline em `#00BA8A`, nenhum preenchido  
- [ ] Verde teal só como acento — nenhum slide dominado por verde  
- [ ] Sem texto transbordando caixa ou saindo do slide  
- [ ] Nenhum placeholder ou lorem ipsum sobrando  
- [ ] Copy usa "assessoria", não "consultoria"  
- [ ] QA visual feito nas imagens renderizadas, slide por slide

---

## 5\. Aplicação em web (LP / site / e-mail / UI)

### 5.1 Head obrigatório

Todo HTML entregue leva favicon e a fonte oficial, sem exceção:

```html
<!-- Favicon GGV Inteligência -->
<link rel="icon" type="image/svg+xml" href="https://ggvinteligencia.com.br/wp-content/uploads/2024/05/Favicon-GGV.svg">
<link rel="apple-touch-icon" href="https://ggvinteligencia.com.br/wp-content/uploads/2024/05/Favicon-GGV.svg">

<!-- Montserrat — não bloqueante -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap">
```

Em Next.js, preferir `next/font` para Montserrat e declarar o favicon em `app/icon.svg` ou no metadata.

### 5.2 Tokens CSS

```css
:root {
  /* Paleta oficial */
  --ggv-navy:       #002060;  /* primária — 60% */
  --ggv-blue:       #33279B;  /* secundária — 25% */
  --ggv-teal:       #00BA8A;  /* acento — 15% */
  --ggv-mint:       #00D38B;  /* hover */
  --ggv-white:      #FFFFFF;

  /* Gradiente oficial */
  --ggv-gradient:   linear-gradient(90deg, #002060 0%, #00BA8A 100%);

  /* Tipografia */
  --ggv-font:       'Montserrat', system-ui, sans-serif;
}

body { font-family: var(--ggv-font); }
```

Em Tailwind v4, declarar os mesmos valores em `@theme inline` como `--color-ggv-navy` etc. Em Tailwind v3, estender `theme.extend.colors`.

### 5.3 Escala tipográfica web

| Elemento | Tamanho | Peso |
| :---- | :---- | :---- |
| H1 / hero | `clamp(2.5rem, 5vw, 3.5rem)` | 700 |
| H2 / seção | `clamp(1.75rem, 3vw, 2.25rem)` | 600 |
| H3 / card | `1.25rem` | 600 |
| Subtítulo / lead | `1.125rem` | 600 |
| Corpo | `1rem` | 400 |
| Label / eyebrow | `0.8125rem` | 700, uppercase, letter-spacing leve |
| Rodapé / legal | `0.8125rem` | 400 |

### 5.4 Padrões de componente

- **Logo no header** — versão colorida se o header for claro, branca se for escuro (navy). Manter a área de reserva.  
- **CTA primário** — fundo verde teal `#00BA8A`, texto navy `#002060` ou branco (o que passar contraste AA), hover para verde menta `#00D38B`. Nunca CTA em azul médio, que compete com o texto.  
- **CTA secundário** — ghost/outline com borda navy, texto navy.  
- **Seção hero** — navy dominante é a assinatura da marca. Fundo navy com texto branco e um único ponto de teal no CTA funciona melhor que fundo branco genérico.  
- **Rodapé** — logo GGV branca \+ logo Grupo GGV negativa (menor) \+ contato \+ social. Faixa com o gradiente oficial como divisor superior do rodapé.  
- **Ícones** — `lucide-react` com `color="#00BA8A"` e `strokeWidth={1.75}`. Nunca ícone preenchido.  
- **Cuidado com contraste** — azul médio `#33279B` sobre navy `#002060` não tem contraste suficiente. Azul médio é para título sobre fundo claro.

### 5.5 Integrações usadas nas LPs da GGV

Incluir só se o usuário pedir ou se for uma LP de campanha real. Confirmar os IDs com ele antes — os abaixo já foram usados e podem ter mudado:

- WhatsApp: plugin Sellbot `https://plugin.sellbot.tech/v3/embed.min.js`, com fallback `wa.me/554135270250` e mensagem pré-preenchida  
- GTM: `GTM-KL4N63SK`  
- Meta Pixel: `1728364274068645`  
- JSON-LD `Organization` no root, com logo em URL absoluta

### 5.6 Checklist antes de entregar (web)

- [ ] Favicon no head  
- [ ] Montserrat declarada e carregando (não caiu em fallback de sistema)  
- [ ] Logo na versão correta para o fundo (colorida em claro / branca em escuro)  
- [ ] Área de reserva do logo respeitada  
- [ ] Proporção aproximada 60% navy / 25% azul médio / 15% teal — teal não dominante  
- [ ] Ícones outline, todos em `#00BA8A`  
- [ ] Contraste de texto passa AA em todos os fundos  
- [ ] Copy usa "assessoria", não "consultoria"  
- [ ] Prova social no formato "+2.000 empresas em 36 segmentos", sem métrica de satisfação  
- [ ] Responsivo testado em mobile (público acessa muito por celular)

---

## 6\. Marcas ainda sem identidade documentada

**Harpia Consultoria, Harpia BPO e Sellbot** ainda não têm identidade registrada neste documento.

**Não usar** a paleta, tipografia ou elementos da GGV Inteligência como substituto — são marcas distintas com identidade própria. Aplicar a identidade da GGV nelas gera material errado que parece certo, que é o pior tipo de erro.

Se pedirem material de uma dessas marcas, pedir ao usuário:

1. **Logos** — versão para fundo claro e versão para fundo escuro (arquivo ou URL), e favicon  
2. **Paleta** — hexadecimais com o papel de cada cor (primária, secundária, acento) e proporção de uso  
3. **Tipografia** — família(s), pesos e hierarquia de tamanhos  
4. **Elementos fixos** — rodapé, decorativos, qualquer coisa obrigatória em todo material  
5. **Tom de voz** — público, promessa, termos obrigatórios e proibidos  
6. **Manual de marca**, se existir (PPTX, PDF ou Figma exportado) — resolve os cinco itens de uma vez

Se o usuário disser que a marca deve usar a identidade da GGV Inteligência por enquanto (comum em marcas novas/em transição), aplicar — mas confirmar antes, não assumir.

---

## 7\. Regras gerais válidas para todas as marcas do grupo

- **Logo:** usar sempre o arquivo oficial via URL. Nunca recriar, redesenhar ou aproximar. Nunca distorcer, rotacionar, recolorir, aplicar sombra ou efeito 3D. Escolher a versão pelo fundo: colorida/padrão em fundo claro, branca/negativa em fundo escuro ou colorido.  
- **Favicon:** toda página, LP ou artefato web leva favicon.  
- **Tipografia:** cada marca tem sua família definida — não substituir por "fonte parecida" ou fallback de sistema sem declarar a oficial primeiro.  
- **Copy:** vocabulário e termos proibidos por marca estão na seção da marca — respeitar mesmo que soe melhor de outro jeito (alguns têm razão jurídica, não estética).  
- **Quando faltar informação: perguntar.** Um material com cor errada volta pra correção; uma pergunta custa dez segundos.

