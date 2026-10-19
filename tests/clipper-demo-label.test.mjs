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

test("title and meta description are demo-labeled", () => {
  assert.match(html, /<title>CourtEyeIQ Clipper \(Demo\)<\/title>/);
  assert.match(html, /<meta name="description" content="Demo preview of CourtEyeIQ Clipper[^"]*Uploads are not live yet\."/);
});

test("hero is demo-labeled", () => {
  assert.match(html, /<div class="eyebrow">Demo preview — uploads are not live yet<\/div>/);
  assert.match(html, /<h1>Coming soon: /);
  assert.match(html, /<p class="hero-copy">This is a demo of the planned flow\./);
});

test("stats do not claim live processing", () => {
  assert.match(html, /<strong>Demo<\/strong><span>no videos are processed yet<\/span>/);
  assert.match(html, /planned MP4 or MOV upload limit/);
  assert.match(html, /output styles planned at launch/);
});

test("every how-it-works step is marked coming soon", () => {
  const steps = html.match(/<div class="steps">([\s\S]*?)<\/section>/)[1];
  assert.equal((steps.match(/<h3>/g) || []).length, 3);
  assert.equal((steps.match(/<span class="badge">Coming soon<\/span><\/h3>/g) || []).length, 3);
});

test("no copy promises a live service", () => {
  for (const claim of [
    /in minutes\./,
    /minute processing after upload/,
    /output styles available now/,
    /Send us your tennis or pickleball video/,
    /Get an email link when/,
    /for free\.<\/h1>/,
    />Upload a video</,
    />Get started</,
  ]) {
    assert.doesNotMatch(html, claim);
  }
});

test("hub card links to the Clipper as a demo", () => {
  const hub = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const card = hub.match(/<a class="card" href="\/clipper">([\s\S]*?)<\/a>/)[1];
  assert.match(card, /Demo only — uploads are not live yet\./);
  assert.match(card, /<span class="status status-beta">Demo<\/span>/);
  assert.doesNotMatch(card, /Free, no account needed/);
});
