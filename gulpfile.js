const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const through2 = require("through2");
const del = require("del");
const plug = require("gulp-load-plugins")();
const browserSync = require("browser-sync").create();

const BUILD_DIR = "icons/svg/build";
const CODEPOINTS_PATH = "icons/codepoints.json";
const START_CODEPOINT = 0xea01;

const icons = {
  pref: "swicon",
  name: "swfont",
  src: "icons/svg/*.svg",
  svg: `${BUILD_DIR}/*.svg`,
  css: "icons/iconfont.css",
  html: "icons/index.html",
  dest: "dist",
  formats: ["woff", "woff2"],
  json: [],
};

const emitManifest = process.argv.includes("--manifest");
const strictMode = process.argv.includes("--strict");
let browserSyncReady = false;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function normalizeIconId(rawName) {
  return String(rawName || "")
    .toLowerCase()
    .replace(/^icons8[-_]?/i, "")
    .replace(/[-_]?svgrepo[-_]?com$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function parseTags(basename) {
  const tagMatch = basename.match(/\[(.+)\]/);
  const withoutTags = tagMatch ? basename.replace(tagMatch[0], "") : basename;
  const id = normalizeIconId(withoutTags);
  const nameParts = id.split("-").filter(Boolean);
  const explicitTags = tagMatch
    ? tagMatch[1]
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
  const tags = [...new Set([...nameParts, ...explicitTags.map((t) => t.toLowerCase())])];
  return { id, tags };
}

function allocateCodepoints(ids) {
  const stored = readJsonSafe(CODEPOINTS_PATH, {});
  const used = new Set(Object.values(stored).map(Number));
  let next = START_CODEPOINT;

  const nextFree = () => {
    while (used.has(next)) next += 1;
    const code = next;
    used.add(code);
    next += 1;
    return code;
  };

  const map = {};
  ids.forEach((id) => {
    if (stored[id]) {
      map[id] = Number(stored[id]);
      used.add(map[id]);
    }
  });

  ids.forEach((id) => {
    if (!map[id]) map[id] = nextFree();
  });

  // Keep only active icons so removed glyphs free their notes (codes stay reserved in file if we want — we drop removed)
  writeJson(CODEPOINTS_PATH, map);
  return map;
}

function icontags(file) {
  const { id, tags } = parseTags(file.basename);

  if (!id) {
    plug.util.log(plug.util.colors.red(`Skipping invalid SVG name: ${file.basename}`));
    return file;
  }

  icons.json.push({
    font: icons.name,
    id,
    ctype: "number",
    tags,
    filter: tags.join(" "),
    className: [icons.pref, id].join("-"),
  });

  file.basename = id;
  return file;
}

function assignStableUnicode(codepoints) {
  return through2.obj(function (file, _, cb) {
    const id = path.basename(file.path, ".svg");
    const code = codepoints[id];
    if (!code) {
      return cb(new Error(`No stable codepoint for "${id}"`));
    }
    file.metadata = {
      name: id,
      unicode: [String.fromCharCode(code)],
    };
    this.push(file);
    cb();
  });
}

function saveJSON(obj, file) {
  return new Promise((resolve, reject) => {
    ensureDir(icons.dest);
    const target = path.join(icons.dest, `${file}.json`);
    fs.writeFile(target, JSON.stringify(obj, null, 2) + "\n", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.on("end", resolve);
    stream.on("finish", resolve);
  });
}

function contentHash(payload) {
  return crypto.createHash("sha1").update(payload).digest("hex").slice(0, 10);
}

function extractSvgInner(svgContent) {
  const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  const innerMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return {
    viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24",
    inner: innerMatch ? innerMatch[1].trim() : "",
  };
}

function writeSprite(files) {
  const symbols = files
    .map((filePath) => {
      const id = path.basename(filePath, ".svg");
      const raw = fs.readFileSync(filePath, "utf8");
      const { viewBox, inner } = extractSvgInner(raw);
      return `  <symbol id="${icons.pref}-${id}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`;
    })
    .join("\n");

  const sprite = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}\n</svg>\n`;
  fs.writeFileSync(path.join(icons.dest, `${icons.name}.sprite.svg`), sprite);
}

function copySvgAssets(files) {
  const outDir = path.join(icons.dest, "svg");
  ensureDir(outDir);
  files.forEach((filePath) => {
    const id = path.basename(filePath);
    fs.copyFileSync(filePath, path.join(outDir, id));
  });
}

function writeComponents(meta) {
  const outDir = path.join(icons.dest, "components");
  ensureDir(outDir);

  const react = `/* Auto-generated by gulp-icon-font — React helpers */\nimport React from "react";\n\nexport const iconNames = ${JSON.stringify(
    meta.map((i) => i.id),
    null,
    2
  )};\n\nexport function SwIcon({ name, className = "", ...props }) {\n  const classNames = ["${icons.pref}-" + name, className].filter(Boolean).join(" ");\n  return <i className={classNames} role="img" aria-hidden={props["aria-label"] ? undefined : true} {...props} />;\n}\n\n${meta
    .map((icon) => {
      const comp = icon.id
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
      return `export function Icon${comp}(props) {\n  return <SwIcon name="${icon.id}" {...props} />;\n}`;
    })
    .join("\n\n")}\n`;

  const vue = `<!-- Auto-generated by gulp-icon-font — Vue 3 SFC helper usage via render fn alternatives -->\n<script>\nexport const iconNames = ${JSON.stringify(
    meta.map((i) => i.id),
    null,
    2
  )};\n\nexport function swIconClass(name) {\n  return "${icons.pref}-" + name;\n}\n</script>\n`;

  const svelte = `<!-- Auto-generated helper notes for Svelte -->\n<script context="module">\n  export const iconNames = ${JSON.stringify(meta.map((i) => i.id))};\n  export const prefix = "${icons.pref}";\n</script>\n`;

  const jacare = `/* Auto-generated by gulp-icon-font — Jacaré (.jcr) helpers
 * Pair with iconfont.css (or swfont.sprite.svg) in your Jacaré app.
 * Docs: https://github.com/jacarejs/core
 */
export const iconNames = ${JSON.stringify(
    meta.map((i) => i.id),
    null,
    2
  )};

export const iconPrefix = '${icons.pref}';

export function swIconClass(name) {
  return iconPrefix + '-' + name;
}

/*
Example SwIcon.jcr:

export <contract>
  props: {
    name: { type: 'string', required: true }
    label: { type: 'string', default: '' }
  }
</contract>

export <view>
  <i
    class=\${() => swIconClass(typeof name === 'function' ? name() : name)}
    role="img"
    aria-label=\${label}
    aria-hidden=\${() => !(typeof label === 'function' ? label() : label)}
  ></i>
</view>
*/
`;

  fs.writeFileSync(path.join(outDir, "react.jsx"), react);
  fs.writeFileSync(path.join(outDir, "vue.js"), vue);
  fs.writeFileSync(path.join(outDir, "svelte.js"), svelte);
  fs.writeFileSync(path.join(outDir, "jacare.js"), jacare);
  fs.writeFileSync(
    path.join(outDir, "README.md"),
    `# Generated icon components\n\n- \`react.jsx\` — \`<SwIcon name="shield" />\` and named exports\n- \`vue.js\` — class helper + icon name list\n- \`svelte.js\` — module exports for names/prefix\n- \`jacare.js\` — helpers for [Jacaré](https://github.com/jacarejs/core) (.jcr)\n- SVG sprite: \`../${icons.name}.sprite.svg\` with \`<use href="#${icons.pref}-shield" />\`\n`
  );
}

function writeZip() {
  return new Promise((resolve, reject) => {
    const archiver = require("archiver");
    const output = fs.createWriteStream(path.join(icons.dest, `${icons.name}.zip`));
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);

    archive.file(path.join(icons.dest, "iconfont.css"), { name: "iconfont.css" });
    archive.file(path.join(icons.dest, "iconfont.json"), { name: "iconfont.json" });
    archive.file(path.join(icons.dest, "codepoints.json"), { name: "codepoints.json" });
    archive.file(path.join(icons.dest, `${icons.name}.woff`), { name: `${icons.name}.woff` });
    archive.file(path.join(icons.dest, `${icons.name}.woff2`), { name: `${icons.name}.woff2` });
    archive.file(path.join(icons.dest, `${icons.name}.sprite.svg`), {
      name: `${icons.name}.sprite.svg`,
    });
    archive.directory(path.join(icons.dest, "svg"), "svg");
    archive.directory(path.join(icons.dest, "components"), "components");
    archive.finalize();
  });
}

function reloadBrowser() {
  if (browserSyncReady) browserSync.reload();
}

function validateSvg() {
  return through2.obj(function (file, _, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    const content = file.contents.toString("utf8");
    const issues = [];

    if (!/viewBox\s*=\s*["'][^"']+["']/i.test(content)) {
      issues.push("missing viewBox");
    }

    const hasPath =
      /<(path|circle|rect|polygon|polyline|ellipse|line)\b/i.test(content) ||
      /<g\b/i.test(content);
    if (!hasPath) {
      issues.push("no drawable shapes found");
    }

    const matches = [...content.matchAll(/fill="([^"]+)"/gi)];
    const colors = new Set(
      matches
        .map((m) => m[1])
        .filter((c) => c && c.toLowerCase() !== "none" && c.toLowerCase() !== "currentcolor")
    );
    if (colors.size > 1) {
      issues.push(`multiple fill colors: ${[...colors].join(", ")}`);
    }

    if (issues.length) {
      const message = `${file.relative}: ${issues.join("; ")}`;
      if (strictMode) return cb(new Error(message));
      plug.util.log(plug.util.colors.yellow(`Warning: ${message}`));
    }

    this.push(file);
    cb();
  });
}

gulp.task("icondel", async () => {
  ensureDir(BUILD_DIR);
  await del([`${BUILD_DIR}/*`], { force: true });
});

gulp.task("clean-dist-stale", async () => {
  await del([`${icons.dest}/vue.js`], { force: true });
});

gulp.task(
  "icontags",
  gulp.series("icondel", () => {
    icons.json = [];
    return gulp
      .src(icons.src)
      .pipe(validateSvg())
      .pipe(plug.rename(icontags))
      .pipe(gulp.dest(BUILD_DIR));
  })
);

gulp.task(
  "iconfont",
  gulp.series("icontags", (done) => {
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      if (err) done(err);
      else done();
    };

    const buildFiles = fs
      .readdirSync(BUILD_DIR)
      .filter((name) => name.endsWith(".svg"))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => path.join(BUILD_DIR, name));

    if (!buildFiles.length) {
      return finish(new Error("No SVG files found in icons/svg/build"));
    }

    icons.json.sort((a, b) => a.id.localeCompare(b.id));
    const codepoints = allocateCodepoints(icons.json.map((icon) => icon.id));

    const fontStream = gulp
      .src(buildFiles, { allowEmpty: false, base: BUILD_DIR })
      .pipe(assignStableUnicode(codepoints))
      .pipe(
        plug.iconfont({
          fontName: icons.name,
          className: icons.pref,
          formats: icons.formats,
          appendCodepoints: false,
          appendUnicode: false,
          normalize: true,
          fontHeight: 1000,
          centerHorizontally: true,
          timestamp: 0,
        })
      )
      .on("glyphs", (glyphs, options) => {
        Promise.resolve()
          .then(() => {
            glyphs.forEach((glyph) => {
              const icon = icons.json.find((i) => i.id === glyph.name);
              if (!icon) {
                throw new Error(
                  `Missing metadata for glyph "${glyph.name}". Check SVG rename/normalize step.`
                );
              }
              icon.code = codepoints[glyph.name] || glyph.unicode[0].charCodeAt(0);
            });

            const hash = contentHash(
              icons.json.map((i) => `${i.id}:${i.code}`).join("|")
            );

            const cssStream = gulp
              .src(icons.css)
              .pipe(
                plug.consolidate("underscore", {
                  glyphs,
                  fontName: options.fontName,
                  className: options.className,
                  fontDate: hash,
                })
              )
              .pipe(gulp.dest(icons.dest));

            const htmlStream = gulp
              .src(icons.html)
              .pipe(
                plug.consolidate("underscore", {
                  glyphs,
                  fontName: options.fontName,
                  className: options.className,
                })
              )
              .pipe(gulp.dest(icons.dest));

            writeSprite(buildFiles);
            copySvgAssets(buildFiles);
            writeComponents(icons.json);

            return Promise.all([
              streamToPromise(cssStream),
              streamToPromise(htmlStream),
              saveJSON(icons.json, "iconfont"),
              emitManifest ? saveJSON(icons.json, "icon-manifest") : Promise.resolve(),
              saveJSON(codepoints, "codepoints"),
            ]).then(() => writeZip());
          })
          .then(() => {
            reloadBrowser();
            finish();
          })
          .catch(finish);
      })
      .on("error", finish)
      .pipe(gulp.dest(icons.dest));

    fontStream.on("error", finish);
  })
);

gulp.task("build", gulp.series("clean-dist-stale", "iconfont"));

gulp.task("serve", (done) => {
  browserSync.init(
    {
      server: { baseDir: `./${icons.dest}` },
      open: true,
      notify: false,
    },
    () => {
      browserSyncReady = true;
      done();
    }
  );
});

gulp.task("reload", (done) => {
  reloadBrowser();
  done();
});

gulp.task("watch-icons", () => {
  gulp.watch([icons.src, icons.html, icons.css], gulp.series("build"));
});

gulp.task("dev", gulp.series("build", gulp.parallel("watch-icons", "serve")));
gulp.task("default", gulp.series("dev"));
