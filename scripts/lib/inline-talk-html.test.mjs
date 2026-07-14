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
