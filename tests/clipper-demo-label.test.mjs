// Guards PAT-76/PAT-231: the Clipper upload form has no backend yet, so it
// must stay clearly demo-labeled and never promise processing or an email.
// Run: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../clipper/index.html", import.meta.url), "utf8");

test("submit button is labeled as a demo", () => {
  assert.match(html, /<button class="btn submit" type="submit">Submit video \(Demo\)<\/button>/);
});

test("form message says nothing is uploaded or processed", () => {
  assert.match(html, /id="formMessage"[^>]*>Demo only — your video is not uploaded or processed yet\./);
});

test("form does not promise an email or processing time", () => {
  assert.doesNotMatch(html, /We'll email you when your highlights are ready/);
});
