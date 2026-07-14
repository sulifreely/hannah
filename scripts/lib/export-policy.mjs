/**
 * Standalone talk export policy — shared by CLI and inliner.
 * Keep export decisions here so decks only mark chrome; they don't know asset origins.
 */

/** Attribute decks put on site-only chrome (back link, analytics wrap, theme toggle). */
export const EXPORT_STRIP_ATTR = 'data-export-strip';

/** Live site origin for local webfont `/_astro/*.woff2` rewrite. */
export const ASSET_ORIGIN = 'https://yanguangjie.com';

/** Corner credit injected into standalone HTML only. */
export const EXPORT_CREDIT = '蘇里';

/**
 * Substring of Astro-bundled Vercel Analytics loader script `src`.
 * The `<Analytics />` island also emits `<vercel-analytics>`; both are stripped.
 */
export const ANALYTICS_SCRIPT_MARKER = 'index.astro_astro_type_script_index_0_lang';

/**
 * @param {'scenes' | 'deck' | undefined} template
 * @returns {'scenes' | 'deck'}
 */
export function slidesPathSuffix(template) {
  return template === 'deck' ? 'deck' : 'scenes';
}
