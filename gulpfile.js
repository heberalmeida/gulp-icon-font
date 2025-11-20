const gulp = require("gulp");
const fs = require("fs");
const through2 = require("through2");
const plug = require("gulp-load-plugins")(); // Carrega todos os plugins do Gulp
const browserSync = require("browser-sync").create(); // Importa o BrowserSync

const icons = {
  pref: "swicon",
  name: "swfont",
  src: "icons/svg/*.svg",
  svg: "icons/svg/build/*.svg",
  css: "icons/iconfont.css",
  html: "icons/index.html",
  vue: "icons/vue.js",
  dest: "dist",
  formats: ["woff", "woff2"],
  json: [],
};

const emitManifest = process.argv.includes("--manifest");

function icontags(file) {
  const path = file;
  const tags = path.basename.match(/(\[)(.+)(\])/),
    name = tags ? path.basename.replace(tags[0], "") : path.basename,
    cats = name.split("-"),
    list = tags ? cats.concat(tags[2].split(",")) : cats;

  icons.json.push({
    font: icons.name,
    id: name,
    ctype: "number",
    tags: list,
    filter: list.join(" "),
    className: [icons.pref, name].join("-"),
  });

  path.basename = name;
  return path;
}

function saveJSON(obj, file, done) {
  const json = JSON.stringify(obj),
    path = `${icons.dest}/${file}.json`;
  fs.writeFile(path, json, done);
}

function validateSingleColor() {
  return through2.obj(function (file, _, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    const content = file.contents.toString("utf8");
    const matches = [...content.matchAll(/fill="([^"]+)"/gi)];
    const colors = new Set(
      matches
        .map((m) => m[1])
        .filter((c) => c && c.toLowerCase() !== "none" && c.toLowerCase() !== "currentcolor")
    );

    if (colors.size > 1) {
      plug.util.log(
        plug.util.colors.yellow(`Warning: ${file.relative} has multiple fill colors: ${[...colors].join(", ")}`)
      );
    }

    this.push(file);
    cb();
  });
}

gulp.task("icondel", (done) => {
  fs.readdir("icons/svg/build", (e, files) => {
    if (!e && files.length)
      files.forEach((file) => fs.unlinkSync(`icons/svg/build/${file}`));
    done();
  });
});

gulp.task(
  "icontags",
  gulp.series("icondel", (done) => {
    icons.json = [];
    gulp
      .src(icons.src)
      .pipe(validateSingleColor())
      .pipe(plug.rename(icontags))
      .pipe(gulp.dest("icons/svg/build"))
      .on("end", done);
  })
);

gulp.task(
  "iconfont",
  gulp.series("icontags", (done) => {
    gulp
      .src(icons.svg)
      .pipe(
        plug.iconfont({
          fontName: icons.name,
          className: icons.pref,
          formats: icons.formats,
          appendCodepoints: true,
          appendUnicode: false,
          normalize: true,
          fontHeight: 1000,
          centerHorizontally: true,
        })
      )
      .on("glyphs", (glyphs, options) => {
        glyphs.forEach((glyph) => {
          let icon = icons.json.find((i) => i.id === glyph.name);
          icon.code = glyph.unicode[0].charCodeAt(0);
        });

        gulp
          .src(icons.css)
          .pipe(
            plug.consolidate("underscore", {
              glyphs: glyphs,
              fontName: options.fontName,
              className: options.className,
              fontDate: Date.now(),
            })
          )
          .pipe(gulp.dest(icons.dest));

        gulp
          .src(icons.html)
          .pipe(
            plug.consolidate("underscore", {
              glyphs: glyphs,
              fontName: options.fontName,
              className: options.className,
            })
          )
          .pipe(gulp.dest(icons.dest))
          .on("end", () => {
            gulp
              .src(icons.vue)
              .pipe(gulp.dest(icons.dest))
              .on("end", () => {
                const totalSaves = emitManifest ? 2 : 1;
                let completed = 0;
                const finish = () => {
                  completed += 1;
                  if (completed >= totalSaves) {
                    browserSync.reload(); // Recarrega o BrowserSync após o término da tarefa
                    done();
                  }
                };

                saveJSON(icons.json, "iconfont", finish);
                if (emitManifest) {
                  saveJSON(icons.json, "icon-manifest", finish);
                }
              }); // Recarrega o BrowserSync após o término da tarefa
          });
      })
      .pipe(gulp.dest(icons.dest));
  })
);

gulp.task("icons-cache", () => {
  return gulp.src("icons/svg/*.svg").pipe(plug.cached("icons-cache"));
});

gulp.task("browser-sync", () => {
  browserSync.init({
    server: {
      baseDir: "./dist",
    },
  });
});

gulp.task("reload", (done) => {
  browserSync.reload();
  done();
});

gulp.task("watch-icons", () => {
  gulp.watch("icons/svg/*.svg", gulp.series("icondel", "icontags", "iconfont"));
  gulp.watch("dist/**/*", gulp.series("reload")); // Observa mudanças em todos os arquivos dentro de dist
});

gulp.task("default", gulp.parallel("iconfont", "watch-icons", "browser-sync"));
