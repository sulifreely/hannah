import TitleSlide from './TitleSlide.astro';
import QuoteSlide from './QuoteSlide.astro';
import SplitSlide from './SplitSlide.astro';
import CodeSlide from './CodeSlide.astro';
import GridSlide from './GridSlide.astro';
import ChainSlide from './ChainSlide.astro';
import BranchSlide from './BranchSlide.astro';
import BulletsSlide from './BulletsSlide.astro';
import DiagramSlide from './DiagramSlide.astro';

/**
 * One place to see every slide type this deck template knows how to render.
 * Adding a 9th slide type means: add its schema in content/config.ts, add
 * its partial next to these, and register it here — NotebookTabsDeck.astro
 * itself never needs to change.
 */
export const SLIDE_RENDERERS = {
  title: TitleSlide,
  quote: QuoteSlide,
  split: SplitSlide,
  code: CodeSlide,
  grid: GridSlide,
  chain: ChainSlide,
  branch: BranchSlide,
  bullets: BulletsSlide,
  diagram: DiagramSlide,
} as const;
