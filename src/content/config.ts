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
    // 指向独立的富交互 HTML 幻灯片（如 /decks/xxx/），
    // 设置后详情页的“Open slides”按钮会跳到这里，
    // 而不是站内基于正文 markdown 渲染的 /talks/[slug]/slides/。
    deckUrl: z.string().optional(),
  }),
});

export const collections = { blog, talks };
