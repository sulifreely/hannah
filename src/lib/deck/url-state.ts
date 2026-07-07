/**
 * The shared `?scene=N&beat=M` URL contract every talk's slides route uses,
 * regardless of which deck template renders it (see ScenesDeck.astro and
 * NotebookTabsDeck.astro). `scene` is 1-indexed in the URL, 0-indexed here.
 *
 * This module only owns the pure read/write/clamp logic — not keyboard,
 * wheel, or touch bindings, which stay in each template because their
 * semantics genuinely differ (beat-aware paging + fullscreen in ScenesDeck,
 * scroll-snap + IntersectionObserver in NotebookTabsDeck).
 */

export interface DeckPosition {
  scene: number;
  beat: number;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Reads `{ scene, beat }` from a `location.search`-style string, clamped to
 * valid bounds. Pass `beatCount` for templates with sub-slide "beats"
 * (ScenesDeck); templates without one (NotebookTabsDeck) can omit it and
 * `beat` always resolves to 0.
 */
export function readPositionFromSearch(
  search: string,
  sceneCount: number,
  beatCount: (scene: number) => number = () => 1,
): DeckPosition {
  const params = new URLSearchParams(search);
  const rawScene = parseInt(params.get('scene') || '1', 10);
  const rawBeat = parseInt(params.get('beat') || '0', 10);
  const scene = clamp(isNaN(rawScene) ? 0 : rawScene - 1, 0, Math.max(0, sceneCount - 1));
  const beat = clamp(isNaN(rawBeat) ? 0 : rawBeat, 0, Math.max(0, beatCount(scene) - 1));
  return { scene, beat };
}

/** Formats `{ scene, beat }` back into a `?scene=N&beat=M` search string. */
export function formatPositionSearch(position: DeckPosition): string {
  const params = new URLSearchParams();
  params.set('scene', String(position.scene + 1));
  params.set('beat', String(position.beat));
  return params.toString();
}

/** Writes the position into the URL without adding a history entry. */
export function syncPositionToURL(position: DeckPosition): void {
  history.replaceState(null, '', location.pathname + '?' + formatPositionSearch(position));
}
