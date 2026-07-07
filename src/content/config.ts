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
// "deck" 布局的结构化幻灯片数据模型
// 每种 slide type 对应 notebook-tabs 模板里的一种视觉组件。
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

const deckSlide = z.discriminatedUnion('type', [
  deckTitleSlide,
  deckQuoteSlide,
  deckSplitSlide,
  deckCodeSlide,
  deckGridSlide,
  deckChainSlide,
  deckBranchSlide,
  deckBulletsSlide,
]);

const talks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    event: z.string().optional(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    // 'scenes'（默认）：正文 markdown 按 ---/+++ 切成 scene/beat 渲染。
    // 'deck'：使用下面的结构化 deck 字段，渲染成 Notebook Tabs 风格的富交互幻灯片。
    template: z.enum(['scenes', 'deck']).default('scenes'),
    deck: z
      .object({
        sections: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
        slides: z.array(deckSlide).min(1),
      })
      .optional(),
  }),
});

export const collections = { blog, talks };
