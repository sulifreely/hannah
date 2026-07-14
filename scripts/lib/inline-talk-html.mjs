import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

// Astro currently emits type before src on module scripts; this regex depends on that order.
const SCRIPT_SRC_RE =
  /<script\b([^>]*\btype=["']module["'][^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi;

/**
 * @param {string} html
 * @param {{
 *   faviconDataUrl: string,
 *   credit: string,
 *   staticRoot?: URL | string,
 *   assetOrigin?: string,
 *   skipAssetInline?: boolean,
 *   skipScriptBundle?: boolean,
 *   fetchImpl?: typeof fetch,
 * }} options
 * `assetOrigin` is the site origin used for local webfont URLs (fonts are not inlined).
 */
export async function transformTalkHtml(html, options) {
  let out = html;

  out = out.replace(/<vercel-analytics\b[^>]*>\s*<\/vercel-analytics>/gi, '');
  // Analytics loader is the only head module script whose src contains this marker
  out = out.replace(
    /<script\b[^>]*src="[^"]*index\.astro_astro_type_script_index_0_lang[^"]*"[^>]*>\s*<\/script>/gi,
    '',
  );
  out = out.replace(/<a\b[^>]*class="[^"]*\bhud-back\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  out = out.replace(/<a\b[^>]*class="[^"]*\bdeck-back-link\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

  if (!options.skipAssetInline) {
    out = await inlineAssets(out, options);
  }
  if (!options.skipScriptBundle) {
    out = await inlineModuleScripts(out, options.staticRoot);
  }

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
  // Use the last </body> — bundled Mermaid/DOMPurify JS contains the literal
  // string "</body>" which would otherwise truncate the script mid-file.
  const bodyClose = out.lastIndexOf('</body>');
  if (bodyClose === -1) {
    throw new Error('Standalone HTML is missing a </body> tag');
  }
  out = `${out.slice(0, bodyClose)}${creditHtml}${out.slice(bodyClose)}`;

  return out;
}

/**
 * @param {string} html
 * @param {URL | string | undefined} staticRoot
 */
async function inlineModuleScripts(html, staticRoot) {
  return replaceAsync(html, SCRIPT_SRC_RE, async (_tag, _beforeSrc, srcPath) => {
    if (!staticRoot) {
      throw new Error('staticRoot is required to bundle module scripts');
    }
    return `<script>${await bundleScript(staticRoot, srcPath)}</script>`;
  });
}

/** @param {URL | string} staticRoot @param {string} srcPath */
async function bundleScript(staticRoot, srcPath) {
  const abs = resolveStaticPath(staticRoot, srcPath);
  const result = await esbuild.build({
    entryPoints: [abs],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    logLevel: 'silent',
    // Astro/Vite client chunks wrap dynamic imports with preload-helper, which
    // injects <link rel="modulepreload" href="/_astro/...">. Those URLs 404 in a
    // standalone file and abort before the already-bundled factory runs (breaks Mermaid).
    plugins: [vitePreloadShimPlugin],
  });
  if (!result.outputFiles?.[0]) {
    throw new Error(`esbuild produced no output for ${srcPath}`);
  }
  return result.outputFiles[0].text;
}

/** Replace Vite's preload-helper with a no-op that just invokes the factory. */
const vitePreloadShimPlugin = {
  name: 'shim-vite-preload',
  setup(build) {
    build.onResolve({ filter: /preload-helper/ }, () => ({
      path: 'vite-preload-shim',
      namespace: 'talk-inline-shim',
    }));
    build.onLoad({ filter: /.*/, namespace: 'talk-inline-shim' }, () => ({
      contents: `
        export function _(factory) {
          return Promise.resolve().then(() => factory());
        }
      `,
      loader: 'js',
    }));
  },
};

/**
 * @param {string} html
 * @param {{
 *   staticRoot?: URL | string,
 *   assetOrigin?: string,
 *   fetchImpl?: typeof fetch,
 * }} options
 */
async function inlineAssets(html, options) {
  const staticRoot = options.staticRoot;
  if (!staticRoot) {
    throw new Error('staticRoot is required to inline local assets');
  }
  const assetOrigin = normalizeOrigin(options.assetOrigin || 'https://yanguangjie.com');
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  // Keep Google Fonts <link> / preconnect as CDN references (do not inline — they dominate file size).
  let out = await replaceAsync(
    html,
    /<link\b(?=[^>]*\brel=(["'])stylesheet\1)[^>]*>/gi,
    async (tag) => {
      const href = attributeValue(tag, 'href');
      if (!href) return tag;
      if (isFontCdnHref(href)) return tag;

      let css;
      if (/^https?:\/\//i.test(href)) {
        const response = await fetchOrThrow(fetchImpl, href);
        css = await response.text();
      } else {
        css = (await readStatic(staticRoot, href)).toString('utf8');
      }
      const rewrittenCss = await rewriteCssUrls(css, href, staticRoot, assetOrigin, fetchImpl);
      return `<style>${rewrittenCss}</style>`;
    },
  );

  return replaceAsync(out, /<img\b[^>]*>/gi, async (tag) => {
    const src = attributeValue(tag, 'src');
    if (!src?.startsWith('/')) return tag;

    const dataUrl = toDataUrl(await readStatic(staticRoot, src), mimeFor(src));
    return replaceAttribute(tag, 'src', dataUrl);
  });
}

/** @param {string} href */
function isFontCdnHref(href) {
  return /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\b/i.test(href);
}

/** @param {string} origin */
function normalizeOrigin(origin) {
  return origin.replace(/\/$/, '');
}

/** @param {string} resolvedPath pathname or absolute URL */
function isFontAsset(resolvedPath) {
  return /^font\//.test(mimeFor(resolvedPath));
}

/**
 * @param {string} css
 * @param {string} cssHref
 * @param {URL | string} staticRoot
 * @param {string} assetOrigin
 * @param {typeof fetch} fetchImpl
 */
async function rewriteCssUrls(css, cssHref, staticRoot, assetOrigin, fetchImpl) {
  return replaceAsync(css, /url\(\s*(?:(["'])(.*?)\1|([^)"']+))\s*\)/gi, async (match, quote, quoted, bare) => {
    const assetRef = (quoted ?? bare).trim();
    if (/^(?:data:|#)/i.test(assetRef)) return match;

    const resolved = resolveCssAsset(assetRef, cssHref);

    // Remote font files (e.g. fonts.gstatic.com) stay as CDN urls — never fetch/inline.
    if (/^https?:\/\//i.test(resolved) && isFontAsset(resolved)) {
      return match;
    }

    // Local webfonts: point at the live site so the single HTML stays small.
    // Requires the matching `_astro` font hashes to be deployed at assetOrigin.
    if (!/^https?:\/\//i.test(resolved) && isFontAsset(resolved)) {
      const absUrl = `${assetOrigin}${resolved.startsWith('/') ? resolved : `/${resolved}`}`;
      const q = quote || '';
      return q ? `url(${q}${absUrl}${q})` : `url(${absUrl})`;
    }

    let bytes;
    if (/^https?:\/\//i.test(resolved)) {
      const response = await fetchOrThrow(fetchImpl, resolved);
      bytes = Buffer.from(await response.arrayBuffer());
    } else {
      bytes = await readStatic(staticRoot, resolved);
    }
    return `url(${toDataUrl(bytes, mimeFor(resolved))})`;
  });
}

/** @param {string} assetRef @param {string} cssHref */
function resolveCssAsset(assetRef, cssHref) {
  if (/^https?:\/\//i.test(assetRef)) return assetRef;
  if (/^https?:\/\//i.test(cssHref)) return new URL(assetRef, cssHref).href;
  if (assetRef.startsWith('/')) return assetRef;

  const basePath = cssHref.split(/[?#]/)[0];
  return path.posix.resolve(path.posix.dirname(basePath), assetRef);
}

/** @param {typeof fetch} fetchImpl @param {string} url */
async function fetchOrThrow(fetchImpl, url) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${url}`);
  }
  return response;
}

/** @param {string} tag @param {string} name */
function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2];
}

/** @param {string} tag @param {string} name @param {string} value */
function replaceAttribute(tag, name, value) {
  return tag.replace(new RegExp(`(\\b${name}\\s*=\\s*)(["']).*?\\2`, 'i'), `$1"${value}"`);
}

/**
 * @param {string} input
 * @param {RegExp} pattern
 * @param {(...args: string[]) => Promise<string>} replacer
 */
async function replaceAsync(input, pattern, replacer) {
  const matches = [...input.matchAll(pattern)];
  const replacements = await Promise.all(matches.map((match) => replacer(...match)));
  let index = 0;
  return input.replace(pattern, () => replacements[index++]);
}

/** @param {string} p */
function mimeFor(p) {
  const pathname = /^https?:\/\//i.test(p) ? new URL(p).pathname : p.split(/[?#]/)[0];
  const ext = path.extname(pathname).toLowerCase();
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
 * @param {URL | string} staticRoot
 * @param {string} urlPath pathname like /_astro/x.css or /images/a.png
 * @returns {string} absolute path within staticRoot
 */
function resolveStaticPath(staticRoot, urlPath) {
  const clean = urlPath.split('?')[0];
  const root = path.resolve(staticRoot instanceof URL ? fileURLToPath(staticRoot) : staticRoot);
  const abs = path.resolve(root, clean.replace(/^\//, ''));
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error(`Static path traversal blocked: ${clean} (resolved ${abs})`);
  }
  return abs;
}

/**
 * @param {URL | string} staticRoot
 * @param {string} urlPath pathname like /_astro/x.css or /images/a.png
 */
async function readStatic(staticRoot, urlPath) {
  const clean = urlPath.split('?')[0];
  const abs = resolveStaticPath(staticRoot, urlPath);
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

/** @param {string} s */
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
