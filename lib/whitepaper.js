const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PROJECT_ROOT = path.resolve(__dirname, "..");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyInlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/\\\$/g, "$").replace(/\\~/g, "~");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

function parseTable(lines, startIndex) {
  const tableLines = [];
  let index = startIndex;

  while (index < lines.length) {
    tableLines.push(lines[index]);
    if (lines[index].trim() === "</table>") {
      break;
    }
    index += 1;
  }

  const rows = [];
  const table = tableLines.join("\n");
  const rowMatches = table.matchAll(/<tr>\s*([\s\S]*?)\s*<\/tr>/g);

  for (const rowMatch of rowMatches) {
    const cells = [];
    const cellMatches = rowMatch[1].matchAll(/<td>([\s\S]*?)<\/td>/g);
    for (const cellMatch of cellMatches) {
      cells.push(cellMatch[1].trim());
    }
    rows.push(cells);
  }

  const head = rows[0] || [];
  const body = rows.slice(1);
  const html = `<table><thead><tr>${head.map((cell) => `<th>${applyInlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${applyInlineMarkdown(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

  return { html, nextIndex: index + 1 };
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let list = [];
  let listTag = "ul";
  let quote = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(`<p>${applyInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    blocks.push(`<${listTag}>${list.map((item) => `<li>${applyInlineMarkdown(item)}</li>`).join("")}</${listTag}>`);
    list = [];
    listTag = "ul";
  }

  function flushQuote() {
    if (!quote.length) return;
    blocks.push(`<blockquote>${quote.map((item) => `<p>${applyInlineMarkdown(item)}</p>`).join("")}</blockquote>`);
    quote = [];
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (trimmed.startsWith("<table")) {
      flushAll();
      const parsed = parseTable(lines, index);
      blocks.push(parsed.html);
      index = parsed.nextIndex - 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushAll();
      blocks.push("<hr>");
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      quote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      blocks.push(`<h${level}>${applyInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = trimmed.match(/^-\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      flushQuote();
      if (list.length && listTag !== "ul") {
        flushList();
      }
      listTag = "ul";
      list.push(listItem[1]);
      continue;
    }

    const orderedItem = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedItem) {
      flushParagraph();
      flushQuote();
      if (list.length && listTag !== "ol") {
        flushList();
      }
      listTag = "ol";
      list.push(orderedItem[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushAll();
  return blocks.join("\n");
}

function signSession(routeKey, password) {
  return crypto.createHmac("sha256", password).update(`courteyeiq:${routeKey}`).digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const [name, ...rest] = part.split("=");
      cookies[name] = decodeURIComponent(rest.join("="));
      return cookies;
    }, {});
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2048) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function renderLayout({ title, body, gated }) {
  const gateClass = gated ? " gate-page" : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="apple-touch-icon" href="/assets/favicon.png">
  <title>${escapeHtml(title)} | CourtEyeIQ</title>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    :root{--paper:#f7f8f5;--white:#fff;--ink:#080908;--muted:#333333;--green:#C41E3A;--green-dark:#99172d;--green-soft:#fbe8ec;--line:rgba(8,9,8,.12);--shadow:0 26px 80px rgba(20,26,22,.12);--sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55;overflow-x:hidden}
    a{color:var(--green-dark);text-decoration:none}a:hover{text-decoration:underline}
    .nav{position:sticky;top:0;z-index:20;background:rgba(247,248,245,.86);backdrop-filter:blur(18px);border-bottom:1px solid rgba(8,9,8,.07)}
    .nav-inner{width:min(1120px,100%);height:58px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
    .logo{display:flex;align-items:center}.logo img{display:block;height:40px;width:auto;object-fit:contain}
    .nav-links{display:flex;align-items:center;gap:22px;font-size:14px;font-weight:650;color:#2f3431}.nav-links a{color:inherit}
    main{width:min(980px,100%);margin:0 auto;padding:72px 24px 92px}
    .document{background:var(--white);border:1px solid rgba(8,9,8,.08);border-radius:8px;box-shadow:var(--shadow);padding:clamp(28px,5vw,58px)}
    .document h1{font-size:clamp(40px,7vw,76px);line-height:.94;letter-spacing:-.075em;margin:0 0 28px}
    .document h2{font-size:clamp(30px,4vw,48px);line-height:1;letter-spacing:-.06em;margin:46px 0 14px}
    .document h3{font-size:25px;line-height:1.14;letter-spacing:-.04em;margin:30px 0 10px}
    .document p,.document li{color:var(--muted)}.document strong{color:var(--ink)}
    .document blockquote{margin:0 0 28px;padding:18px 20px;border-left:4px solid var(--green);background:var(--green-soft);border-radius:8px;color:var(--green-dark)}
    .document blockquote p{margin:0;color:var(--green-dark);font-weight:650}
    .document hr{border:0;border-top:1px solid var(--line);margin:38px 0}
    .document ul,.document ol{padding-left:22px}.document li{margin:8px 0}
    .document code{background:#f0f2ee;border:1px solid rgba(8,9,8,.08);border-radius:6px;padding:1px 5px;font-size:.92em}
    .document table{width:100%;border-collapse:collapse;margin:22px 0 34px;background:#fff;border:1px solid var(--line);font-size:15px}
    .document th,.document td{padding:13px 14px;border:1px solid var(--line);text-align:left;vertical-align:top}
    .document th{background:var(--green-soft);color:var(--green-dark);font-weight:800}
    .gate-page main{display:grid;min-height:calc(100vh - 58px);place-items:center;padding-top:42px;padding-bottom:42px}
    .gate{width:min(520px,100%);background:var(--white);border:1px solid rgba(8,9,8,.08);border-radius:8px;box-shadow:var(--shadow);padding:34px}
    .gate h1{font-size:clamp(34px,7vw,54px);line-height:.96;letter-spacing:-.065em;margin:0}
    .gate p{color:var(--muted);margin:14px 0 24px}
    .field{display:grid;gap:8px}.label{font-size:13px;font-weight:780;color:#444c47}
    .control{width:100%;border:1px solid #d9ded9;border-radius:16px;background:#fff;color:var(--ink);min-height:50px;padding:13px 14px;outline:none}.control:focus{border-color:var(--green);box-shadow:0 0 0 4px rgba(196,30,58,.14)}
    .btn{width:100%;border:0;border-radius:16px;min-height:50px;margin-top:14px;padding:13px 23px;background:var(--green);color:var(--white);font:inherit;font-weight:780;cursor:pointer}.btn:hover{background:var(--green-dark)}
    .error{margin:14px 0 0;color:var(--green-dark);font-weight:650}
    @media(max-width:640px){.nav-inner{height:54px;padding:0 16px}.nav-links{gap:14px;font-size:13px}main{padding:42px 16px 64px}.document{padding:24px}.document table{display:block;overflow-x:auto}.gate{padding:24px}}
  </style>
</head>
<body class="${gateClass.trim()}">
  <nav class="nav" aria-label="CourtEyeIQ">
    <div class="nav-inner">
      <a class="logo" href="/" aria-label="CourtEyeIQ home"><img src="/assets/logo.png" alt="CourtEyeIQ"></a>
      <div class="nav-links">
        <a href="/whitepaper">Whitepaper</a>
        <a href="/clipper">Clipper</a>
        <a href="/whitepaper-lite">Partner Overview</a>
      </div>
    </div>
  </nav>
  <main>${body}</main>
</body>
</html>`;
}

function renderGate({ title, description, error }) {
  return renderLayout({
    title,
    gated: true,
    body: `<section class="gate" aria-labelledby="gate-title">
      <h1 id="gate-title">${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <form method="post">
        <div class="field">
          <label class="label" for="password">Password</label>
          <input class="control" id="password" name="password" type="password" autocomplete="current-password" required autofocus>
        </div>
        <button class="btn" type="submit">View whitepaper</button>
        ${error ? '<p class="error" role="alert">Incorrect password. Please try again.</p>' : ""}
      </form>
    </section>`,
  });
}

function renderDocument({ title, contentPath }) {
  const markdown = fs.readFileSync(path.join(PROJECT_ROOT, contentPath), "utf8");
  return renderLayout({
    title,
    gated: false,
    body: `<article class="document">${renderMarkdown(markdown)}</article>`,
  });
}

function createWhitepaperHandler(config) {
  return async function handler(req, res) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.setHeader("Cache-Control", "private, no-store");

    const password = process.env[config.passwordEnv];

    if (!password) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(renderLayout({
        title: "Whitepaper unavailable",
        gated: true,
        body: '<section class="gate"><h1>Whitepaper unavailable</h1><p>The password environment variable is not configured yet.</p></section>',
      }));
      return;
    }

    const cookieName = `ceiq_${config.routeKey}`;
    const expectedSession = signSession(config.routeKey, password);
    const cookies = parseCookies(req.headers.cookie);
    const isUnlocked = safeEqual(cookies[cookieName], expectedSession);

    if (req.method === "POST") {
      const body = await readBody(req);
      const submitted = new URLSearchParams(body).get("password") || "";

      if (safeEqual(submitted, password)) {
        res.statusCode = 303;
        res.setHeader("Set-Cookie", `${cookieName}=${encodeURIComponent(expectedSession)}; Path=${config.path}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`);
        res.setHeader("Location", config.path);
        res.end();
        return;
      }

      res.statusCode = 401;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(renderGate({ title: config.title, description: config.description, error: true }));
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.setHeader("Allow", "GET, HEAD, POST");
      res.end("Method Not Allowed");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(isUnlocked
      ? renderDocument({ title: config.title, contentPath: config.contentPath })
      : renderGate({ title: config.title, description: config.description, error: false }));
  };
}

module.exports = {
  createWhitepaperHandler,
};
