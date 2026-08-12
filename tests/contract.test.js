#!/usr/bin/env node
/**
 * Contract test: public icon API (className + codepoint) must stay stable
 * unless icons/codepoints.json intentionally changes.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const iconfont = JSON.parse(fs.readFileSync(path.join(root, "dist/iconfont.json"), "utf8"));
const codepoints = JSON.parse(fs.readFileSync(path.join(root, "icons/codepoints.json"), "utf8"));
const snapshotPath = path.join(__dirname, "snapshots/icon-api.json");

assert.ok(Array.isArray(iconfont), "iconfont.json must be an array");
assert.ok(iconfont.length > 0, "iconfont.json must include icons");

iconfont.forEach((icon) => {
  assert.ok(icon.id, "icon.id required");
  assert.ok(icon.className === `swicon-${icon.id}`, `className mismatch for ${icon.id}`);
  assert.strictEqual(
    icon.code,
    codepoints[icon.id],
    `codepoint drift for ${icon.id}: dist=${icon.code} map=${codepoints[icon.id]}`
  );
  assert.ok(fs.existsSync(path.join(root, "dist/svg", `${icon.id}.svg`)), `missing svg ${icon.id}`);
});

assert.ok(fs.existsSync(path.join(root, "dist/swfont.sprite.svg")), "sprite missing");
assert.ok(fs.existsSync(path.join(root, "dist/swfont.zip")), "zip missing");
assert.ok(fs.existsSync(path.join(root, "dist/components/react.jsx")), "react components missing");

const current = iconfont
  .map((icon) => ({ id: icon.id, className: icon.className, code: icon.code }))
  .sort((a, b) => a.id.localeCompare(b.id));

if (process.argv.includes("--update")) {
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(current, null, 2) + "\n");
  console.log("Updated snapshot:", snapshotPath);
  process.exit(0);
}

assert.ok(fs.existsSync(snapshotPath), "snapshot missing — run: node tests/contract.test.js --update");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
assert.deepStrictEqual(current, snapshot, "Public icon API snapshot mismatch (breaking change?)");

console.log(`contract ok · ${current.length} icons`);
