import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).max(3, '博客 tags 最多 3 个').default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// ===========================================
// "deck" 模板的结构化幻灯片数据模型（见下方 talkBase 附近的选型说明）
// 每种 slide type 对应 notebook-tabs 模板里的一种视觉组件，渲染由
// src/components/decks/notebook-tabs/registry.ts 里的 SLIDE_RENDERERS 分发。
// ===========================================
const deckRefLink = z.object({ label: z.string(), href: z.string() });
const deckSlideBase = { section: z.string().optional() };

const deckTitleSlide = z.object({
  type: z.literal('title'),
  ...deckSlideBase,
  eyebrow: z.string().optional(),
  title: z.string(),
  lead: z.string().optional(),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
});

const deckQuoteSlide = z.object({
  type: z.literal('quote'),
  ...deckSlideBase,
  eyebrow: z.string().optional(),
  quote: z.string(),
  lead: z.string().optional(),
  heading: z.string().optional(),
  centered: z.boolean().optional(),
});

const deckSplitSlide = z.object({
  type: z.literal('split'),
  ...deckSlideBase,
  kicker: z.string().optional(),
  heading: z.string(),
  columns: z
    .array(
      z.object({
        label: z.string(),
        dot: z.string().optional(),
        items: z.array(z.string()),
      }),
    )
    .length(2),
});

const deckCodeSlide = z.object({
  type: z.literal('code'),
  ...deckSlideBase,
  kicker: z.string().optional(),
  heading: z.string().optional(),
  code: z.string(),
  bullets: z.array(z.string()).optional(),
});

const deckGridSlide = z.object({
  type: z.literal('grid'),
  ...deckSlideBase,
  kicker: z.string().optional(),
  heading: z.string(),
  columns: z.number().optional(),
  cards: z.array(
    z.object({
      num: z.string(),
      title: z.string(),
      desc: z.string(),
    }),
  ),
  lead: z.string().optional(),
});

const deckChainSlide = z.object({
  type: z.literal('chain'),
  ...deckSlideBase,
  kicker: z.string().optional(),
  heading: z.string(),
  steps: z.array(
    z.object({
      label: z.string(),
      variant: z.enum(['ghost', 'hero']).optional(),
    }),
  ),
  retry: z.string().optional(),
  lead: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  refs: z.array(deckRefLink).optional(),
});

const deckBranchSlide = z.object({
  type: z.literal('branch'),
  ...deckSlideBase,
  kicker: z.string().optional(),
  heading: z.string(),
  hero: z.string(),
  branches: z.array(z.string()),
  ghost: z.string().optional(),
  lead: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  refs: z.array(deckRefLink).optional(),
});

const deckBulletsSlide = z.object({
  type: z.literal('bullets'),
  ...deckSlideBase,
  kicker: z.string().optional(),
  heading: z.string(),
  bullets: z.array(z.string()),
});

// A real Mermaid flowchart (same syntax + rendering pipeline as blog posts —
// see remarkMermaid in astro.config.mjs and the mermaid.run() call in
// NotebookTabsDeck.astro), for slides that want to reuse a diagram 1:1
// instead of redrawing it with the chip/chain/branch primitives.
const deckDiagramSlide = z.object({
  type: z.literal('diagram'),
  ...deckSlideBase,
  kicker: z.string().optional(),
  heading: z.string().optional(),
  mermaid: z.string(),
  lead: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  refs: z.array(deckRefLink).optional(),
});

const deckSlide = z.discriminatedUnion('type', [
  deckTitleSlide,
  deckQuoteSlide,
  deckSplitSlide,
  deckCodeSlide,
  deckGridSlide,
  deckChainSlide,
  deckBranchSlide,
  deckBulletsSlide,
  deckDiagramSlide,
]);

const talkBase = {
  title: z.string(),
  subtitle: z.string().optional(),
  event: z.string().optional(),
  date: z.coerce.date(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
};

// A talk is one of two shapes, picked by `template`. Modeling this as a
// discriminated union (rather than `template: enum` + an always-optional
// `deck` field) means a 'deck' talk is *required* to carry `deck.slides`
// at the type level — no more `talk.data.deck!` non-null assertions at the
// render site, and no way to typo a deck talk into shipping without slides.
//
// Which one should a new talk use?
//
// 'scenes' (default) — write prose in the markdown body, split into scenes
//   with a `---` line and, within a scene, into reveal-by-click "beats"
//   with a `+++` line. Cheapest to author: it's just markdown, and it
//   reuses the site's normal typography. Pick this for talks that are
//   closer to an illustrated essay than a slide deck. Rendered by
//   ScenesDeck.astro.
//
// 'deck' — write each slide as a typed object under `deck.slides` (title /
//   quote / split / code / grid / chain / branch / bullets — see the
//   schemas above), optionally grouped into `deck.sections` for the tab
//   rail. More upfront structure per slide, but you get the Notebook Tabs
//   visual system (diagrams, code blocks, card grids) and Zod validates
//   every slide at build time instead of failing silently in the browser.
//   Pick this for talks meant to be presented, not just read. Rendered by
//   NotebookTabsDeck.astro.
//
// Both templates share one `slides/?scene=N&beat=0` URL contract
// (src/lib/deck/url-state.ts) — deep links and back/forward work the same
// way regardless of which template a given talk uses.
const scenesTalk = z.object({
  ...talkBase,
  template: z.literal('scenes'),
});

const deckTalk = z.object({
  ...talkBase,
  template: z.literal('deck'),
  deck: z.object({
    sections: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
    slides: z.array(deckSlide).min(1),
  }),
});

const talks = defineCollection({
  type: 'content',
  // `template` defaults to 'scenes' when omitted entirely from frontmatter;
  // the discriminated union itself only dispatches on a value that's
  // already present, so the default is filled in up front.
  schema: z.preprocess((value) => {
    if (value && typeof value === 'object' && !('template' in value)) {
      return { ...value, template: 'scenes' };
    }
    return value;
  }, z.discriminatedUnion('template', [scenesTalk, deckTalk])),
});

export const collections = { blog, talks };
