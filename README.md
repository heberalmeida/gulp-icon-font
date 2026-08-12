# gulp-icon-font

Pipeline Gulp que transforma SVGs em **icon font** (WOFF/WOFF2) + CSS + galeria interativa para buscar, pré-visualizar e copiar classes.

**Demo ao vivo:** [https://heberalmeida.github.io/gulp-icon-font/](https://heberalmeida.github.io/gulp-icon-font/)

---

## Como funciona

```
icons/svg/*.svg
      │
      ▼
┌─────────────────┐
│  1. icontags    │  limpa tags do nome, valida fills, gera metadados
└────────┬────────┘
         ▼
┌─────────────────┐
│  2. iconfont    │  gulp-iconfont → .woff / .woff2
└────────┬────────┘
         ▼
┌─────────────────┐
│  3. templates   │  CSS + HTML + iconfont.json em dist/
└────────┬────────┘
         ▼
   BrowserSync / GitHub Pages
```

1. **Entrada** — você adiciona SVGs monocromáticos em `icons/svg/`.
2. **Tags no filename** — `shield[test, new].svg` vira id `shield` com tags `test` e `new` (mais segmentos do nome) para a busca na galeria.
3. **Geração da font** — `gulp-iconfont` normaliza os glyphs, atribui unicode e emite `swfont.woff` / `swfont.woff2`.
4. **CSS** — o template `icons/iconfont.css` é preenchido com `@font-face` e classes `swicon-{nome}`.
5. **Galeria** — `icons/index.html` + `iconfont.json` formam o preview em `dist/` (busca, tema, tamanho/cor, copy-to-clipboard).
6. **Watch** — `gulp` sobe BrowserSync e reconstrói quando um SVG muda.

> SVGs multicoloridos não funcionam bem como font. O build avisa se detectar vários `fill` no mesmo arquivo.

---

## Pré-requisitos

- Node.js (testado em v18+)
- `gulp-cli` global
- Yarn (ou npm)

## Instalação

```bash
npm install -g gulp-cli
yarn install
```

## Uso local

```bash
gulp          # build + watch + BrowserSync (abre dist/)
yarn watch    # só o watcher
```

Fluxo típico:

1. Rode `gulp`.
2. Adicione/edite SVGs em `icons/svg/`.
3. A galeria atualiza sozinha — busque e copie classes.

### Consumir no seu projeto

```html
<link rel="stylesheet" href="/caminho/para/dist/iconfont.css" />

<i class="swicon-shield" role="img" aria-label="shield icon"></i>
```

Tamanho e cor via CSS (`font-size` / `color`):

```html
<i class="swicon-users" style="font-size: 28px; color: #0f766e;"></i>
```

### Tags nos SVGs

```
icon-name[search, ui].svg
```

As tags viram chips na galeria e entram no filtro de busca.

### Manifest opcional

```bash
gulp --manifest
```

Além de `iconfont.json`, gera `icon-manifest.json` com os mesmos metadados para outros pipelines.

---

## Deploy (GitHub Pages)

O site estático sai de `dist/`. Com o build atualizado:

```bash
yarn deploy
# equivalente: npx gh-pages -d dist
```

Isso publica a branch `gh-pages`. A URL pública é:

**https://heberalmeida.github.io/gulp-icon-font/**

---

## Estrutura

| Caminho | Função |
|--------|--------|
| `icons/svg/` | SVGs de origem (com tags opcionais no nome) |
| `icons/svg/build/` | SVGs limpos (sem `[tags]`) usados na font |
| `icons/iconfont.css` | Template Underscore do CSS |
| `icons/index.html` | Template da galeria |
| `gulpfile.js` | Tasks: tags → font → CSS/HTML/JSON → serve |
| `dist/` | Artefatos finais (font, CSS, preview, JSON) |

Prefixo das classes: `swicon-` · Nome da font: `swfont`.

---

## Observações

- Prefira SVGs de um único tom (`fill` único ou `currentColor`).
- Não edite `dist/` à mão — ele é regenerado pelo Gulp.
- Ajuste `icons.pref` / `icons.name` no `gulpfile.js` se quiser outro prefixo ou nome de família.
