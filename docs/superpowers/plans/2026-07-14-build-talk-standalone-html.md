# Standalone Talk HTML Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `npm run build:talk -- <slug>` that produces a fully offline single HTML file for one talk's slides.

**Architecture:** Run `astro build`, then post-process `.vercel/output/static/talks/<slug>/slides/index.html`: strip analytics and back-links, inject favicon data-URL + credit「蘇里」, inline CSS/fonts/images, and esbuild-bundle every `type="module"` script so `file://` works without imports.

**Tech Stack:** Node.js (ESM), Node built-in `node:test` / `node:assert`, `esbuild` (devDependency), existing Astro + `@astrojs/vercel` static output.

## Global Constraints

- Command: `npm run build:talk -- <slug>` (slug required)
- Output: `dist-talk/<slug>.html` (gitignore; never commit)
- Offline: must open via `file://` with no network
- Favicon: inline `public/favicon.png` as data URL
- Credit text: exactly `蘇里` (no site name)
- Remove back links (`.hud-back`, `.deck-back-link`) entirely
- Do not change online `/talks/<slug>/slides/` source components for this feature — all transforms are post-build
- Static root with Vercel adapter: `.vercel/output/static/` (not `dist/`)
- Commit messages: Chinese, semantic prefixes (`feat` / `chore` / `test`)

## File Structure

| File | Responsibility |
|------|----------------|
| `scripts/lib/inline-talk-html.mjs` | Pure transforms: clean HTML, resolve/inline assets, bundle scripts, inject chrome |
| `scripts/build-talk.mjs` | CLI: parse slug, run `astro build`, call inliner, write `dist-talk/` |
| `scripts/lib/inline-talk-html.test.mjs` | Unit tests for transforms (fixture HTML, no full site build) |
| `package.json` | `build:talk` script + `esbuild` devDependency |
| `.gitignore` | `dist-talk/` |

---

### Task 1: Scaffold CLI wiring + failing tests for HTML chrome transforms

**Files:**
- Create: `scripts/lib/inline-talk-html.mjs`
- Create: `scripts/lib/inline-talk-html.test.mjs`
- Modify: `package.json` (scripts + esbuild)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `export function transformTalkHtml(html, options)` — options shape filled in later tasks; for this task only chrome cleaning needs to work:
  - `options.faviconDataUrl: string`
  - `options.credit: string` (always `"蘇里"` from CLI later)
- Consumes: nothing yet from other tasks

- [ ] **Step 1: Add gitignore + npm script + esbuild**

Append to `.gitignore`:

```
# standalone talk exports
dist-talk/
```

In `package.json` `scripts`:

```json
"build:talk": "node scripts/build-talk.mjs",
"test:talk-inline": "node --test scripts/lib/inline-talk-html.test.mjs"
```

Install esbuild:

```bash
npm install -D esbuild
```

- [ ] **Step 2: Write failing tests for chrome transforms**

Create `scripts/lib/inline-talk-html.test.mjs`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { transformTalkHtml } from './inline-talk-html.mjs';

const FAVICON = 'data:image/png;base64,AAA';

describe('transformTalkHtml chrome', () => {
  it('removes vercel-analytics element and its loader script', () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="icon" href="/favicon.png">
<vercel-analytics data-props="{}"></vercel-analytics>
<script type="module" src="/_astro/index.astro_astro_type_script_index_0_lang.B4IMVBju.js"></script>
<link rel="stylesheet" href="/_astro/slides.css">
</head><body>
<a class="hud-back" href="/talks/x/">← back</a>
<a class="deck-back-link" href="/talks/x/">← back</a>
<p>content</p>
</body></html>`;

    const out = transformTalkHtml(html, {
      faviconDataUrl: FAVICON,
      credit: '蘇里',
      staticRoot: new URL('./fixtures-unused/', import.meta.url),
      skipAssetInline: true,
    });

    assert.equal(out.includes('vercel-analytics'), false);
    assert.equal(out.includes('index.astro_astro_type_script_index_0_lang'), false);
    assert.equal(out.includes('hud-back'), false);
    assert.equal(out.includes('deck-back-link'), false);
    assert.match(out, /rel="icon"[^>]*href="data:image\/png;base64,AAA"/);
    assert.match(out, /class="talk-credit"[^>]*>蘇里</);
    assert.equal(out.includes('yanguangjie.com'), false);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm run test:talk-inline
```

Expected: FAIL (`transformTalkHtml` not found / not exported).

- [ ] **Step 4: Minimal chrome implementation**

Create `scripts/lib/inline-talk-html.mjs`:

```js
/**
 * @param {string} html
 * @param {{
 *   faviconDataUrl: string,
 *   credit: string,
 *   staticRoot?: URL | string,
 *   skipAssetInline?: boolean,
 * }} options
 */
export function transformTalkHtml(html, options) {
  let out = html;

  out = out.replace(/<vercel-analytics\b[^>]*>\s*<\/vercel-analytics>/gi, '');
  // Analytics loader is the only head module script whose src contains this marker
  out = out.replace(
    /<script\b[^>]*src="[^"]*index\.astro_astro_type_script_index_0_lang[^"]*"[^>]*>\s*<\/script>/gi,
    '',
  );
  out = out.replace(/<a\b[^>]*class="[^"]*\bhud-back\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  out = out.replace(/<a\b[^>]*class="[^"]*\bdeck-back-link\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

  out = out.replace(
    /<link\b[^>]*rel="icon"[^>]*>/i,
    `<link rel="icon" type="image/png" href="${options.faviconDataUrl}">`,
  );
  if (!/rel="icon"/i.test(out)) {
    out = out.replace(
      /<\/head>/i,
      `<link rel="icon" type="image/png" href="${options.faviconDataUrl}"></head>`,
    );
  }

  const creditHtml = `<div class="talk-credit" aria-label="作者">${escapeHtml(options.credit)}</div>
<style>
.talk-credit{
  position:fixed;
  top:var(--deck-corner-inset-y, clamp(10px, 2vh, 20px));
  left:var(--deck-corner-inset-x, clamp(14px, 2vw, 26px));
  z-index:var(--deck-corner-z, 100);
  font-size:0.85rem;
  opacity:0.55;
  pointer-events:none;
  letter-spacing:0.04em;
}
</style>`;
  out = out.replace(/<\/body>/i, `${creditHtml}</body>`);

  if (!options.skipAssetInline) {
    throw new Error('asset inlining not implemented');
  }
  return out;
}

/** @param {string} s */
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm run test:talk-inline
```

Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore \
  scripts/lib/inline-talk-html.mjs scripts/lib/inline-talk-html.test.mjs
git commit -m "$(cat <<'EOF'
feat: scaffold talk standalone HTML chrome transforms

EOF
)"
```

---

### Task 2: Inline local CSS, fonts, images; fetch+inline Google Fonts CSS

**Files:**
- Modify: `scripts/lib/inline-talk-html.mjs`
- Modify: `scripts/lib/inline-talk-html.test.mjs`
- Create: `scripts/lib/fixtures/sample-slides.html` (tiny fixture)
- Create: `scripts/lib/fixtures/static/_astro/slides.css`
- Create: `scripts/lib/fixtures/static/_astro/font.woff2` (tiny fake bytes)
- Create: `scripts/lib/fixtures/static/images/talks/cover.png` (tiny PNG bytes)
- Create: `scripts/lib/fixtures/static/favicon.png` (tiny PNG bytes)

**Interfaces:**
- Consumes: `transformTalkHtml` from Task 1
- Produces:
  - `transformTalkHtml(html, { faviconDataUrl, credit, staticRoot, fetchImpl? })` fully inlines `<link rel="stylesheet" href="...">` (local + https fonts.googleapis.com), `url(...)` inside CSS, and `<img src="/...">`
  - Still leaves `<script type="module" src>` for Task 3 (or no-ops them if `skipScriptBundle: true` for tests)

- [ ] **Step 1: Write failing asset-inline tests**

Add to `scripts/lib/inline-talk-html.test.mjs`:

```js
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const fixturesStatic = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures/static',
);

describe('transformTalkHtml assets', () => {
  it('inlines local stylesheet, css url(), and img src as data URLs', async () => {
    const html = fs.readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/sample-slides.html'),
      'utf8',
    );
    const favicon = fs.readFileSync(path.join(fixturesStatic, 'favicon.png'));
    const faviconDataUrl = `data:image/png;base64,${favicon.toString('base64')}`;

    const out = await transformTalkHtml(html, {
      faviconDataUrl,
      credit: '蘇里',
      staticRoot: fixturesStatic,
      skipScriptBundle: true,
    });

    assert.equal(out.includes('href="/_astro/slides.css"'), false);
    assert.equal(out.includes('src="/images/talks/cover.png"'), false);
    assert.match(out, /<style>[\s\S]*data:font\/woff2;base64,/);
    assert.match(out, /<img[^>]+src="data:image\/png;base64,/);
  });

  it('inlines Google Fonts CSS via fetchImpl and embedded font files', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans">
</head><body><p>x</p></body></html>`;

    const fakeCss = `@font-face{font-family:'DM Sans';src:url(https://fonts.gstatic.com/s/fake.woff2)}`;
    const fetchImpl = async (url) => {
      if (String(url).includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => fakeCss, arrayBuffer: async () => new ArrayBuffer(0) };
      }
      if (String(url).includes('fonts.gstatic.com')) {
        return {
          ok: true,
          text: async () => '',
          arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
        };
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const out = await transformTalkHtml(html, {
      faviconDataUrl: FAVICON,
      credit: '蘇里',
      staticRoot: fixturesStatic,
      skipScriptBundle: true,
      fetchImpl,
    });

    assert.equal(out.includes('fonts.googleapis.com'), false);
    assert.equal(out.includes('fonts.gstatic.com'), false);
    assert.match(out, /data:font\/woff2;base64,/);
    assert.equal(out.includes('rel="preconnect"'), false);
  });
});
```

Change `transformTalkHtml` to **async** in the chrome test as well (`await transformTalkHtml(...)`).

- [ ] **Step 2: Create fixtures**

`scripts/lib/fixtures/static/_astro/slides.css`:

```css
@font-face {
  font-family: Fake;
  src: url(/_astro/font.woff2) format('woff2');
}
body { color: #111; }
```

`scripts/lib/fixtures/sample-slides.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="icon" href="/favicon.png">
  <link rel="stylesheet" href="/_astro/slides.css">
</head>
<body>
  <img src="/images/talks/cover.png" alt="cover">
  <p>hi</p>
</body>
</html>
```

Write tiny binary fixtures:

```bash
mkdir -p scripts/lib/fixtures/static/_astro scripts/lib/fixtures/static/images/talks
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' \
  > scripts/lib/fixtures/static/favicon.png
cp scripts/lib/fixtures/static/favicon.png scripts/lib/fixtures/static/images/talks/cover.png
printf 'wOFF2fake' > scripts/lib/fixtures/static/_astro/font.woff2
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm run test:talk-inline
```

Expected: FAIL on asset assertions / `skipAssetInline` path.

- [ ] **Step 4: Implement asset inlining**

Extend `inline-talk-html.mjs`:

1. Make `transformTalkHtml` `async`.
2. Remove `skipAssetInline` throw path; add real inlining when `skipAssetInline` is not true.
3. Helpers (keep in same file unless it exceeds ~250 lines — then split `scripts/lib/inline-assets.mjs`):

```js
import fs from 'node:fs/promises';
import path from 'node:path';

/** @param {string} p */
function mimeFor(p) {
  const ext = path.extname(p).toLowerCase();
  return (
    {
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    }[ext] || 'application/octet-stream'
  );
}

/**
 * @param {string} staticRoot
 * @param {string} urlPath pathname like /_astro/x.css or /images/a.png
 */
async function readStatic(staticRoot, urlPath) {
  const clean = urlPath.split('?')[0];
  const abs = path.join(staticRoot, clean.replace(/^\//, ''));
  try {
    return await fs.readFile(abs);
  } catch {
    throw new Error(`Missing static asset: ${clean} (resolved ${abs})`);
  }
}

/** @param {Buffer} buf @param {string} mime */
function toDataUrl(buf, mime) {
  return `data:${mime};base64,${buf.toString('base64')}`;
}
```

Inlining algorithm (order matters):

1. Drop `<link rel="preconnect" ...fonts.googleapis.com|fonts.gstatic.com...>`
2. For each `<link rel="stylesheet" href="HREF">`:
   - If `HREF` starts with `http`: `const css = await (await fetchImpl(HREF)).text()`; if `!ok` throw
   - Else: `css = (await readStatic(staticRoot, HREF)).toString('utf8')`
   - Rewrite every `url(...)` in CSS:
     - Strip quotes; resolve relative to CSS URL base
     - Local `/_astro/...` → readStatic → data URL
     - `https://fonts.gstatic.com/...` → fetch binary → data URL
   - Replace the `<link>` with `<style>${rewrittenCss}</style>`
3. For each `<img ... src="/...">` (and `src='/...\'`): replace with data URL from readStatic
4. Replace favicon link as in Task 1 (use provided `faviconDataUrl`)

Keep `skipScriptBundle: true` behavior: leave `<script type="module" src=...>` untouched for now.

Export still named `transformTalkHtml` but returns `Promise<string>`.

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm run test:talk-inline
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/inline-talk-html.mjs scripts/lib/inline-talk-html.test.mjs scripts/lib/fixtures
git commit -m "$(cat <<'EOF'
feat: inline talk slide CSS fonts and images for offline HTML

EOF
)"
```

---

### Task 3: Bundle module scripts with esbuild for `file://`

**Files:**
- Modify: `scripts/lib/inline-talk-html.mjs`
- Modify: `scripts/lib/inline-talk-html.test.mjs`
- Create: `scripts/lib/fixtures/static/_astro/entry.js`
- Create: `scripts/lib/fixtures/static/_astro/dep.js`

**Interfaces:**
- Consumes: esbuild `build({ entryPoints, bundle: true, write: false, format: 'iife', platform: 'browser' })`
- Produces: every external `<script type="module" src="/_astro/...">` replaced with `<script>${bundledIife}</script>`; inline `<script type="module">...</script>` without src left as-is (already self-contained)

- [ ] **Step 1: Write failing script-bundle test**

Fixtures:

`dep.js`:
```js
export const msg = 'bundled-ok';
```

`entry.js`:
```js
import { msg } from './dep.js';
document.documentElement.dataset.bundle = msg;
```

Test:

```js
it('esbuild-bundles external module scripts into inline IIFE', async () => {
  const html = `<!DOCTYPE html><html><head>
<link rel="icon" href="/favicon.png">
</head><body>
<script type="module" src="/_astro/entry.js"></script>
</body></html>`;

  const out = await transformTalkHtml(html, {
    faviconDataUrl: FAVICON,
    credit: '蘇里',
    staticRoot: fixturesStatic,
  });

  assert.equal(out.includes('src="/_astro/entry.js"'), false);
  assert.match(out, /bundled-ok/);
  assert.equal(out.includes('from "./dep.js"'), false);
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm run test:talk-inline
```

Expected: FAIL (script still has src).

- [ ] **Step 3: Implement bundling**

In `transformTalkHtml`, after CSS/img inlining, process scripts:

```js
import * as esbuild from 'esbuild';

const SCRIPT_SRC_RE =
  /<script\b([^>]*\btype=["']module["'][^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi;

async function bundleScript(staticRoot, srcPath) {
  const abs = path.join(staticRoot, srcPath.replace(/^\//, '').split('?')[0]);
  const result = await esbuild.build({
    entryPoints: [abs],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    logLevel: 'silent',
  });
  if (!result.outputFiles?.[0]) {
    throw new Error(`esbuild produced no output for ${srcPath}`);
  }
  return result.outputFiles[0].text;
}
```

Replace each match with `<script>${await bundleScript(...)}</script>`.

If `skipScriptBundle: true`, skip this step.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:talk-inline
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/inline-talk-html.mjs scripts/lib/inline-talk-html.test.mjs scripts/lib/fixtures
git commit -m "$(cat <<'EOF'
feat: bundle talk slide module scripts for file:// offline open

EOF
)"
```

---

### Task 4: CLI `scripts/build-talk.mjs` end-to-end

**Files:**
- Create: `scripts/build-talk.mjs`
- Modify: `package.json` only if needed

**Interfaces:**
- Consumes: `transformTalkHtml` from `scripts/lib/inline-talk-html.mjs`
- Produces: CLI exit codes; writes `dist-talk/<slug>.html`

- [ ] **Step 1: Implement CLI**

`scripts/build-talk.mjs`:

```js
#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformTalkHtml } from './lib/inline-talk-html.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];

if (!slug || slug.startsWith('-')) {
  console.error('Usage: npm run build:talk -- <slug>');
  console.error('Example: npm run build:talk -- agent-hitl-vs-yolo');
  process.exit(1);
}

const staticRoot = path.join(root, '.vercel/output/static');
const slidesHtmlPath = path.join(staticRoot, 'talks', slug, 'slides', 'index.html');
const outDir = path.join(root, 'dist-talk');
const outFile = path.join(outDir, `${slug}.html`);

console.error(`Building site (astro build) for talk "${slug}"...`);
const build = spawnSync('npx', ['astro', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (build.status !== 0) {
  console.error('astro build failed');
  process.exit(build.status ?? 1);
}

try {
  await fs.access(slidesHtmlPath);
} catch {
  console.error(`Slides not found for slug "${slug}": ${slidesHtmlPath}`);
  console.error('Check that the talk exists, is not draft, and template built slides.');
  process.exit(1);
}

const html = await fs.readFile(slidesHtmlPath, 'utf8');
const faviconBuf = await fs.readFile(path.join(root, 'public/favicon.png'));
const faviconDataUrl = `data:image/png;base64,${faviconBuf.toString('base64')}`;

let standalone;
try {
  standalone = await transformTalkHtml(html, {
    faviconDataUrl,
    credit: '蘇里',
    staticRoot,
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(outFile, standalone, 'utf8');
console.log(`Wrote ${path.relative(root, outFile)}`);
```

- [ ] **Step 2: Smoke-test scenes talk**

```bash
npm run build:talk -- agent-hitl-vs-yolo
```

Expected:
- Command exits 0
- Prints `Wrote dist-talk/agent-hitl-vs-yolo.html`
- File exists and size is > 100KB (fonts inlined)

Manual checks:

```bash
rg -n 'hud-back|deck-back-link|vercel-analytics|src="/_astro/|href="/_astro/|href="/favicon|fonts\.googleapis|fonts\.gstatic' dist-talk/agent-hitl-vs-yolo.html || true
rg -n 'talk-credit|>蘇里<' dist-talk/agent-hitl-vs-yolo.html
rg -n 'rel="icon"[^>]*data:image/png' dist-talk/agent-hitl-vs-yolo.html
```

Expected: first `rg` empty; credit + favicon match.

Open `file://.../dist-talk/agent-hitl-vs-yolo.html` and confirm arrow-key navigation works.

- [ ] **Step 3: Smoke-test deck talk (Google Fonts + mermaid)**

```bash
npm run build:talk -- execution-topology-in-skills
```

Expected: exits 0; no `fonts.googleapis.com` / `fonts.gstatic.com` left; mermaid diagrams render offline.

```bash
rg -n 'fonts\.googleapis|fonts\.gstatic|src="/_astro/' dist-talk/execution-topology-in-skills.html || true
rg -n 'talk-credit|>蘇里<' dist-talk/execution-topology-in-skills.html
```

- [ ] **Step 4: Error-path checks**

```bash
npm run build:talk -- ; echo exit:$?
npm run build:talk -- does-not-exist-slug ; echo exit:$?
```

Expected: both non-zero; usage / “Slides not found” messages.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-talk.mjs package.json
git commit -m "$(cat <<'EOF'
feat: add npm run build:talk for offline single-file slides

EOF
)"
```

Do **not** add `dist-talk/` outputs.

---

### Task 5: Document the command in AGENT.md

**Files:**
- Modify: `AGENT.md` (Talks section — short usage note)

- [ ] **Step 1: Add docs blurb**

Under `### 演讲（Talks）`, at the end of that section, add:

```markdown
**导出离线单文件：**

```bash
npm run build:talk -- <slug>
```

会先跑站点构建，再把 `/talks/<slug>/slides/` 内联成 `dist-talk/<slug>.html`（可直接用浏览器打开，含 favicon 与署名「蘇里」，无返回站点链接）。`dist-talk/` 已 gitignore。
```

- [ ] **Step 2: Commit**

```bash
git add AGENT.md
git commit -m "$(cat <<'EOF'
docs: document build:talk offline export command

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `npm run build:talk -- <slug>` | 4 |
| Output `dist-talk/<slug>.html` + gitignore | 1, 4 |
| astro build then inline | 4 |
| Inline CSS/JS/fonts/images | 2, 3 |
| Google Fonts download+inline | 2 |
| Favicon data URL | 1, 4 |
| Credit `蘇里` only | 1, 4 |
| Remove back links | 1 |
| Strip Analytics | 1 |
| Clear errors for missing slug / missing slides | 4 |
| Offline `file://` (bundled modules) | 3, 4 |
| No online slides source change | all (post-process only) |

## Self-review notes

- Static root corrected to `.vercel/output/static/` (Vercel adapter).
- No TBD/placeholder steps; async `transformTalkHtml` called out when chrome tests update.
- esbuild IIFE addresses multi-chunk + dynamic `import('mermaid')` under `file://`.
- Font subset inlining may produce multi‑MB HTML — expected; not a failure.
