# site-adrian-masella

Landing page (página de captura) de uma página só para **Adrian Masella**, gestor de
tráfego pago. Build **estático** — HTML + CSS + um único `app.js` em JavaScript puro,
sem framework e sem dependências externas de runtime.

## Origem

Convertido a partir do protótipo de design `Pagina Adrian Masella.dc.html` (formato
Claude Design). O `dc-runtime` (`support.js`) e a sintaxe de template (`{{ }}`,
`<sc-if>`, `<sc-for>`) foram removidos; o formulário de 7 etapas foi reimplementado
em `app.js`.

## Estrutura

```
index.html        página completa
app.js            formulário multi-etapa, reveal on scroll, luz do mouse, shim de hover
privacidade.html  Política de Privacidade (RASCUNHO — revisar)
termos.html       Termos de Uso (RASCUNHO — revisar)
assets/           imagens (banner, logos, patterns)
.nojekyll         desliga o processamento Jekyll no GitHub Pages
```

## Rodar localmente

```
npx serve .
# ou
python -m http.server
```

## Deploy — GitHub Pages

Publicado via GitHub Pages a partir da branch `main`, pasta raiz (`/`).
URL: https://eusouoereque.github.io/site-adrian-masella/

Para publicar atualizações, basta um `git push` na `main`.

## Pendências antes de considerar "no ar de verdade"

- [ ] **Destino dos leads.** Hoje o formulário só faz `window.dataLayer.push(...)`
  (eventos `form_start`, `lead_captured`, `lead_qualificado` / `lead_desqualificado`)
  e um `console.debug`. Para captar leads de fato, plugar o envio na função `push()`
  de `app.js`: container do GTM, endpoint Formspree/webhook, ou integração com CRM.
- [ ] **Textos legais.** `privacidade.html` e `termos.html` são rascunhos padrão —
  revisar / substituir pelo texto oficial.
- [ ] **Dados de contato.** Confirmar e-mail (`contato@adrianmasella.com`), Instagram
  e LinkedIn do rodapé.
- [ ] **Domínio próprio** (opcional). Se configurar um domínio customizado no Pages,
  atualizar `<link rel="canonical">` e as tags `og:` em `index.html` e adicionar um
  arquivo `CNAME`.
- [ ] **Favicon / imagem de compartilhamento** dedicados (hoje usa `logo-simbolo.png`
  e `banner-hero.jpg`).
