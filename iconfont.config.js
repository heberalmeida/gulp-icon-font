/**
 * External build config for gulp-icon-font / swfont CLI.
 * Override any field; unspecified keys keep defaults from gulpfile.
 */
module.exports = {
  pref: "swicon",
  name: "swfont",
  src: "icons/svg/*.svg",
  dest: "dist",
  formats: ["woff", "woff2"],
  startCodepoint: 0xea01,
  codepointsPath: "icons/codepoints.json",
  buildDir: "icons/svg/build",
  cssTemplate: "icons/iconfont.css",
  htmlTemplate: "icons/index.html",
  maskCss: true,
  components: true,
  zip: true,
  sprite: true,
};
