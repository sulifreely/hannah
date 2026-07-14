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
  it('removes export-strip chrome, analytics, and injects credit', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="icon" href="/favicon.png">
<div data-export-strip><vercel-analytics data-props="{}"></vercel-analytics></div>
<script type="module" src="/_astro/index.astro_astro_type_script_index_0_lang.B4IMVBju.js"></script>
<link rel="stylesheet" href="/_astro/slides.css">
</head><body>
<a class="hud-back" data-export-strip href="/talks/x/">← back</a>
<a class="deck-back-link" data-export-strip href="/talks/x/">← back</a>
<span data-export-strip><button id="theme-toggle">theme</button></span>
<p>content</p>
</body></html>`;

    const out = await transformTalkHtml(html, {
      faviconDataUrl: FAVICON,
      staticRoot: new URL('./fixtures-unused/', import.meta.url),
      skipAssetInline: true,
    });

    assert.equal(out.includes('vercel-analytics'), false);
    assert.equal(out.includes('index.astro_astro_type_script_index_0_lang'), false);
    assert.equal(out.includes('data-export-strip'), false);
    assert.equal(out.includes('hud-back'), false);
    assert.equal(out.includes('deck-back-link'), false);
    assert.equal(out.includes('theme-toggle'), false);
    assert.match(out, /rel="icon"[^>]*href="data:image\/png;base64,AAA"/);
    assert.match(out, /class="talk-credit"[^>]*>蘇里</);
    assert.equal(out.includes('yanguangjie.com'), false);
  });
});

describe('transformTalkHtml assets', () => {
  it('inlines local stylesheet and images; rewrites font urls to assetOrigin', async () => {
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
      assetOrigin: 'https://yanguangjie.com',
      skipScriptBundle: true,
    });

    assert.equal(out.includes('href="/_astro/slides.css"'), false);
    assert.equal(out.includes('src="/images/talks/cover.png"'), false);
    assert.match(out, /url\(https:\/\/yanguangjie\.com\/_astro\/font\.woff2\)/);
    assert.equal(out.includes('data:font/woff2;base64,'), false);
    assert.match(out, /<img[^>]+src="data:image\/png;base64,/);
  });

  it('keeps Google Fonts CDN stylesheet and preconnect links', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans">
</head><body><p>x</p></body></html>`;

    const fetchImpl = async () => {
      throw new Error('fetch should not run for Google Fonts CDN links');
    };

    const out = await transformTalkHtml(html, {
      faviconDataUrl: FAVICON,
      credit: '蘇里',
      staticRoot: fixturesStatic,
      skipScriptBundle: true,
      fetchImpl,
    });

    assert.match(out, /rel="preconnect"[^>]*href="https:\/\/fonts\.googleapis\.com"/);
    assert.match(out, /rel="stylesheet"[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Sans"/);
    assert.equal(out.includes('data:font/woff2;base64,'), false);
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

  it('shims Vite preload-helper so dynamic-import factories still run', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="icon" href="/favicon.png">
</head><body>
<script type="module" src="/_astro/with-vite-preload.js"></script>
</body></html>`;

    const out = await transformTalkHtml(html, {
      faviconDataUrl: FAVICON,
      credit: '蘇里',
      staticRoot: fixturesStatic,
    });

    assert.match(out, /preload-shimmed/);
    assert.equal(out.includes('raw preload helper should be shimmed away'), false);
    assert.equal(out.includes('modulepreload'), false);
  });

  it('throws when module script src attempts traversal outside staticRoot', async () => {
    const html = `<!DOCTYPE html><html><head></head><body>
<script type="module" src="/../../../etc/passwd"></script>
</body></html>`;

    await assert.rejects(
      () =>
        transformTalkHtml(html, {
          faviconDataUrl: FAVICON,
          credit: '蘇里',
          staticRoot: fixturesStatic,
          skipAssetInline: true,
        }),
      /Static path traversal blocked/,
    );
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

  it('injects credit at the last </body>, not one inside a script string', async () => {
    const html = `<!DOCTYPE html><html><head>
<link rel="icon" href="/favicon.png">
</head><body>
<script>const s = '<body></body>';</script>
</body></html>`;

    const out = await transformTalkHtml(html, {
      faviconDataUrl: FAVICON,
      credit: '蘇里',
      skipAssetInline: true,
      skipScriptBundle: true,
    });

    assert.match(out, /const s = '<body><\/body>';/);
    assert.match(out, /<\/script>\s*<div class="talk-credit"/);
    assert.equal(out.includes("'<body><div class=\"talk-credit\""), false);
  });
});
