import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { transformTalkHtml } from './inline-talk-html.mjs';

const FAVICON = 'data:image/png;base64,AAA';
const fixturesStatic = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures/static',
);

describe('transformTalkHtml chrome', () => {
  it('removes vercel-analytics element and its loader script', async () => {
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

    const out = await transformTalkHtml(html, {
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

  it('throws when local stylesheet path is missing under staticRoot', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="/_astro/missing.css">
</head><body></body></html>`;

    await assert.rejects(
      () =>
        transformTalkHtml(html, {
          faviconDataUrl: FAVICON,
          credit: '蘇里',
          staticRoot: fixturesStatic,
        }),
      /Missing static asset: \/_astro\/missing\.css/,
    );
  });

  it('throws when local image path is missing under staticRoot', async () => {
    const html = `<!DOCTYPE html><html><body>
<img src="/images/missing.png">
</body></html>`;

    await assert.rejects(
      () =>
        transformTalkHtml(html, {
          faviconDataUrl: FAVICON,
          credit: '蘇里',
          staticRoot: fixturesStatic,
        }),
      /Missing static asset: \/images\/missing\.png/,
    );
  });

  it('throws when fetchImpl returns ok:false for Google Fonts stylesheet', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans">
</head><body></body></html>`;

    const fetchImpl = async () => ({ ok: false });

    await assert.rejects(
      () =>
        transformTalkHtml(html, {
          faviconDataUrl: FAVICON,
          credit: '蘇里',
          staticRoot: fixturesStatic,
          fetchImpl,
        }),
      /Failed to fetch asset: https:\/\/fonts\.googleapis\.com/,
    );
  });

  it('throws when static path attempts traversal outside staticRoot', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="/../../../etc/passwd">
</head><body></body></html>`;

    await assert.rejects(
      () =>
        transformTalkHtml(html, {
          faviconDataUrl: FAVICON,
          credit: '蘇里',
          staticRoot: fixturesStatic,
        }),
      /Static path traversal blocked/,
    );
  });
});

describe('transformTalkHtml scripts', () => {
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

  it('leaves inline module scripts without src unchanged', async () => {
    const inlineScript = '<script type="module">document.body.dataset.inline = "ok";</script>';
    const html = `<!DOCTYPE html><html><head></head><body>${inlineScript}</body></html>`;

    const out = await transformTalkHtml(html, {
      faviconDataUrl: FAVICON,
      credit: '蘇里',
      skipAssetInline: true,
    });

    assert.match(out, new RegExp(inlineScript.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});
