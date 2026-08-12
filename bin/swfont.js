#!/usr/bin/env node
/**
 * swfont — thin CLI around the gulp-icon-font pipeline.
 *
 *   swfont build [--strict] [--manifest]
 *   swfont dev
 *   swfont add <file.svg> [--tags a,b]
 *   swfont test
 *   swfont help
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const args = process.argv.slice(2);
const cmd = args[0] || "help";
const rest = args.slice(1);

function run(bin, binArgs, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, binArgs, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...opts,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} exited with ${code}`));
    });
  });
}

function localBin(name) {
  const ext = process.platform === "win32" ? ".cmd" : "";
  return path.join(root, "node_modules", ".bin", name + ext);
}

function help() {
  console.log(`swfont — SVG → icon font toolkit

Usage:
  swfont build [--strict] [--manifest]   Build font, CSS, gallery, zip
  swfont dev                             Build + watch + BrowserSync
  swfont add <file.svg> [--tags a,b]     Copy SVG into icons/svg/
  swfont test                            Contract + (optional) smoke
  swfont help                            Show this help

Config: iconfont.config.js in the project root.
`);
}

async function addIcon() {
  const fileArg = rest.find((a) => !a.startsWith("-"));
  if (!fileArg) {
    console.error("Usage: swfont add <file.svg> [--tags a,b]");
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  if (!/\.svg$/i.test(abs)) {
    console.error("Only .svg files are supported");
    process.exit(1);
  }

  let tags = [];
  const tagIdx = rest.indexOf("--tags");
  if (tagIdx !== -1 && rest[tagIdx + 1]) {
    tags = rest[tagIdx + 1]
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const base = path.basename(abs, ".svg").replace(/\[.+\]$/, "");
  const destName = tags.length ? `${base}[${tags.join(",")}].svg` : `${base}.svg`;
  const destDir = path.join(root, "icons", "svg");
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, destName);
  fs.copyFileSync(abs, dest);
  console.log(`Added ${path.relative(root, dest)}`);
  console.log("Run: swfont build");
}

async function main() {
  try {
    if (cmd === "help" || cmd === "-h" || cmd === "--help") {
      help();
      return;
    }
    if (cmd === "build") {
      await run(localBin("gulp"), ["build", ...rest]);
      return;
    }
    if (cmd === "dev") {
      await run(localBin("gulp"), ["dev", ...rest]);
      return;
    }
    if (cmd === "add") {
      await addIcon();
      return;
    }
    if (cmd === "test") {
      await run(process.execPath, [path.join(root, "tests", "contract.test.js")]);
      if (rest.includes("--smoke")) {
        await run(localBin("playwright"), ["test"]);
      }
      return;
    }
    console.error(`Unknown command: ${cmd}\n`);
    help();
    process.exit(1);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
