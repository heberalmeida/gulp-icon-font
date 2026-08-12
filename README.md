# gulp-icon-font

Gulp pipeline that turns SVGs into an **icon font** (WOFF/WOFF2) + CSS + an interactive gallery to search, preview, and copy class names.

**Live demo:** [https://heberalmeida.github.io/gulp-icon-font/](https://heberalmeida.github.io/gulp-icon-font/)

---

## How it works

```
icons/svg/*.svg
      │
      ▼
┌─────────────────┐
│  1. icontags    │  strip tags from filenames, validate fills, build metadata
└────────┬────────┘
         ▼
┌─────────────────┐
│  2. iconfont    │  gulp-iconfont → .woff / .woff2
└────────┬────────┘
         ▼
┌─────────────────┐
│  3. templates   │  CSS + HTML + iconfont.json into dist/
└────────┬────────┘
         ▼
   BrowserSync / GitHub Pages
```

1. **Input** — add single-color SVGs to `icons/svg/`.
2. **Filename tags** — `shield[test, new].svg` becomes id `shield` with tags used by gallery search.
3. **Font generation** — `gulp-iconfont` normalizes glyphs, assigns unicode, and emits `swfont.woff` / `swfont.woff2`.
4. **CSS** — `icons/iconfont.css` is filled with `@font-face` and `swicon-{name}` classes.
5. **Gallery** — `icons/index.html` + `iconfont.json` power the preview in `dist/` (search, theme, size/color, copy-to-clipboard).
6. **Watch** — `gulp` starts BrowserSync and rebuilds when an SVG changes.

> Multi-color SVGs do not work well as a font. The build warns if it detects multiple `fill` values in the same file.

---

## Prerequisites

- Node.js **20+** (see `.nvmrc`)
- Yarn (or npm)
- Optional global `gulp-cli` (or use `yarn build` / `yarn swfont`)

## Installation

```bash
yarn install
```

## Local usage

```bash
yarn build          # one-shot font + gallery build into dist/
yarn dev            # build + watch + BrowserSync
yarn swfont build   # same via CLI
yarn swfont add ./icon.svg --tags ui,nav
yarn deploy         # publish dist/ to GitHub Pages
```

Typical flow:

1. Run `yarn dev` (or `yarn swfont dev`).
2. Add/edit SVGs in `icons/svg/`. Optional tags: `name[tag1, tag2].svg`.
3. The gallery refreshes — fuzzy search, select, ⌘K palette, copy classes.

Gallery extras:

- Deep links: `?icon=shield&size=40&color=%230b7a6c`
- Fuzzy search (Fuse.js) + command palette
- Contrast lab with auto color adjust on dark backgrounds
- Glyph diff panel (added / changed / removed since last build)
- Offline PWA (installable demo)
- Stable codepoints in `icons/codepoints.json`
- Strict validation: `yarn build -- --strict`
- Export pack: `dist/swfont.zip`
- SVG sprite: `dist/swfont.sprite.svg`
- Dual CSS: `iconfont.css` (font) + `iconfont.mask.css` (mask / multi-color)
- Config: `iconfont.config.js`
- Tests: `yarn test` · `yarn test:smoke`


### Use in your project

```html
<link rel="stylesheet" href="/path/to/dist/iconfont.css" />

<i class="swicon-shield" role="img" aria-label="shield icon"></i>
```

CSS mask (tint with `color` / `background-color`):

```html
<link rel="stylesheet" href="/path/to/dist/iconfont.mask.css" />
<span class="swicon-mask-shield" style="font-size:28px;color:#0f766e"></span>
```

Size and color via CSS (`font-size` / `color`):

```html
<i class="swicon-users" style="font-size: 28px; color: #0f766e;"></i>
```

### Tagging SVGs

```
icon-name[search, ui].svg
```

Tags become chips in the gallery and feed the search filter.

### Optional manifest

```bash
gulp build --manifest
```

Also writes `icon-manifest.json` alongside `iconfont.json` for other pipelines.

---

## Deploy (GitHub Pages)

Static output lives in `dist/`. With a fresh build:

```bash
yarn deploy
# same as: npx gh-pages -d dist
```

That publishes the `gh-pages` branch. Public URL:

**https://heberalmeida.github.io/gulp-icon-font/**

---

## Structure

| Path | Role |
|------|------|
| `icons/svg/` | Source SVGs (optional tags in the filename) |
| `icons/svg/build/` | Cleaned SVGs (tags stripped) used for the font |
| `icons/iconfont.css` | Underscore CSS template (font) |
| `icons/iconfont.mask.css` | Underscore CSS template (mask) |
| `icons/index.html` | Gallery template |
| `iconfont.config.js` | External build config (prefix, formats, paths) |
| `bin/swfont.js` | CLI (`build` / `dev` / `add` / `test`) |
| `gulpfile.js` | Tasks: tags → font → CSS/HTML/JSON → serve |
| `dist/` | Final assets (font, CSS, preview, JSON, PWA) |

Class prefix: `swicon-` · Font family: `swfont` · Mask prefix: `swicon-mask-`.

---

## Notes

- Prefer single-tone SVGs (`fill` once, or `currentColor`) for the font path; use mask CSS when you need flexible tinting.
- Do not edit `dist/` by hand — Gulp regenerates it.
- Override `pref` / `name` / paths in `iconfont.config.js` (not only in the gulpfile).
