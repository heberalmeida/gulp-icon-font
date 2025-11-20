### Gulp SVG Icons to Font

Icon pipeline powered by Gulp: drop SVGs in, get a generated icon font plus an interactive gallery to search, preview, and copy class names.

---

## Prerequisites

- Node.js (tested on v18.19.0)
- `gulp-cli` installed globally

## Installation

1. Install `gulp-cli`:
   ```bash
   npm install -g gulp-cli
   ```
2. Install project dependencies:
   ```bash
   yarn install
   ```

## Usage

1. Start the build + watcher:
   ```bash
   gulp
   ```
2. Add your SVG files to `icons/svg`. The watcher rebuilds the font and refreshes the gallery automatically.
3. Open the generated preview (auto-opens by default) and search icons by class, tag, or unicode. Use the copy buttons to grab a class name, unicode, accessible snippet, or a ready-to-use HTML/CSS example for your markup. Adjust size and color live with the preview controls or presets, then copy the generated snippet.

### Consume in your project

- Include the generated CSS and font assets from `dist`:
  ```html
  <link rel="stylesheet" href="/dist/iconfont.css">
  ```
- Use the class pattern `swicon-{file-name}` on an element:
  ```html
  <i class="swicon-search" role="img" aria-label="search icon"></i>
  ```
- Refer to the live preview for copy-ready snippets and usage examples.

### Quick styling examples

Change size (CSS `font-size`):
```html
<i class="swicon-example" style="font-size: 32px;"></i>
```

Change color (CSS `color` cascades to the icon font):
```html
<i class="swicon-example" style="color: #2563eb;"></i>
```

Combine size and color in a reusable class:
```html
<style>
.icon-primary {
  font-size: 28px;
  color: #0ea5e9;
}
</style>

<i class="swicon-example icon-primary" role="img" aria-label="example icon"></i>
```

## Tagging Your Icons

Name SVG files with square brackets to attach tags that improve search in the gallery:
```
icon-name[search, ui].svg
```
Tags are displayed as chips and are used by the gallery filter.

## Live Demo

https://heberalmeida.github.io/gulp-icon-font

## Project Notes

- `gulpfile.js` contains the tasks that compile the SVGs into a font, generate `iconfont.json`, and serve the preview page. Edit only if you intend to change the pipeline.
- Preview page (`icons/index.html`) now includes enhanced search, copy-to-clipboard buttons, tag chips, result counts, a refreshed layout, light/dark toggle with saved preference, and live size/color presets.
- The build expects single-color SVGs for reliable font output; multi-color SVGs are not supported. Simplify artwork before adding to `icons/svg`.
- Run `gulp --manifest` to emit an additional `icon-manifest.json` alongside `iconfont.json` for other pipelines.
- Each SVG is validated for single-color fills during the build; files with multiple fills emit a warning in the console (kept non-blocking so you can fix progressively). 

## Ideas for Extensions

- Export additional formats (e.g., SVG sprite or individual React/Vue components) alongside the font.
- Add linting/validation for SVGs (size, stroke/fill rules) before build.
- Include accessibility helpers in the preview (ARIA guidance, suggested markup snippets).
- Publish the generated font package to an internal registry for reuse.
- Add a "copy accessible snippet" button in the gallery that inserts `role="img"` plus `aria-label` guidance.
- Provide per-icon usage examples (HTML/CSS) and ready-to-copy code blocks.
- Add a small CLI flag to emit a JSON manifest of icon metadata for other pipelines.
- Validate that SVGs are single-color shapes (required for reliable font generation) and warn otherwise. 
