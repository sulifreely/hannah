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
