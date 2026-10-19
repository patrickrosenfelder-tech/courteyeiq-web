// Guards PAT-1199: logo/favicon optimization, real intrinsic dimensions, and caching headers
// Run: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const clipperHtml = readFileSync(new URL("../clipper/index.html", import.meta.url), "utf8");
const roadmapHtml = readFileSync(new URL("../roadmap/index.html", import.meta.url), "utf8");
const vercelConfig = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

test("logo.png and logo.webp are under 50 KB", () => {
  const pngPath = new URL("../assets/logo.png", import.meta.url);
  const webpPath = new URL("../assets/logo.webp", import.meta.url);

  assert.ok(existsSync(pngPath), "assets/logo.png must exist");
  assert.ok(existsSync(webpPath), "assets/logo.webp must exist");

  const pngSize = statSync(pngPath).size;
  const webpSize = statSync(webpPath).size;

  assert.ok(pngSize < 50 * 1024, `logo.png size (${pngSize} bytes) should be under 50 KB`);
  assert.ok(webpSize < 50 * 1024, `logo.webp size (${webpSize} bytes) should be under 50 KB`);
});

test("favicon set files exist and are under 10 KB", () => {
  const files = [
    { url: new URL("../assets/favicon.png", import.meta.url), name: "assets/favicon.png" },
    { url: new URL("../assets/favicon-32x32.png", import.meta.url), name: "assets/favicon-32x32.png" },
    { url: new URL("../assets/apple-touch-icon.png", import.meta.url), name: "assets/apple-touch-icon.png" },
    { url: new URL("../assets/favicon.ico", import.meta.url), name: "assets/favicon.ico" },
    { url: new URL("../favicon.ico", import.meta.url), name: "favicon.ico" },
  ];

  for (const file of files) {
    assert.ok(existsSync(file.url), `${file.name} must exist`);
    const size = statSync(file.url).size;
    assert.ok(size < 10 * 1024, `${file.name} size (${size} bytes) should be under 10 KB`);
  }
});

test("logo in index.html uses real intrinsic dimensions and loading=eager", () => {
  assert.doesNotMatch(indexHtml, /width="auto"/, "width='auto' should not be used on img");
  assert.match(indexHtml, /<picture>[\s\S]*?<source\s+srcset="\/assets\/logo\.webp"\s+type="image\/webp">[\s\S]*?<img\s+src="\/assets\/logo\.png"\s+alt="CourtEyeIQ"\s+width="\d+"\s+height="\d+"\s+loading="eager"\s+decoding="async">[\s\S]*?<\/picture>/);
});

test("index.html references real favicon set", () => {
  assert.match(indexHtml, /<link rel="icon" type="image\/x-icon" href="\/favicon\.ico">/);
  assert.match(indexHtml, /<link rel="icon" type="image\/png" sizes="32x32" href="\/assets\/favicon-32x32\.png">/);
  assert.match(indexHtml, /<link rel="apple-touch-icon" sizes="180x180" href="\/assets\/apple-touch-icon\.png">/);
});

test("vercel.json configures non-zero max-age Cache-Control for assets", () => {
  assert.ok(Array.isArray(vercelConfig.headers), "headers must be an array in vercel.json");
  const assetRule = vercelConfig.headers.find(h => h.source && h.source.includes("/assets/"));
  assert.ok(assetRule, "must have a header rule for /assets/");
  const cacheHeader = assetRule.headers.find(h => h.key.toLowerCase() === "cache-control");
  assert.ok(cacheHeader, "assets must have Cache-Control header");
  assert.match(cacheHeader.value, /max-age=[1-9]\d*/, "Cache-Control must have non-zero max-age");
});
