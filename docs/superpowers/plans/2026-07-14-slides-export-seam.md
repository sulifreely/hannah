# Slides 路由拆分 + 导出接缝 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 按 template 切开 slides 资产图，并建立 slides 导出接缝（`data-export-strip` + 导出策略模块）。

**Architecture:** 两个页面模块各只 import 一种 deck；`/talks/<slug>/slides/` 薄页仅 `Astro.redirect` 到 `slides-scenes` 或 `slides-deck`（无 deck import，避免 dual-bundle）。导出侧用 `data-export-strip` + `scripts/lib/export-policy.mjs`，inliner 只消费该接缝。

**Tech Stack:** Astro 5、@astrojs/vercel、现有 `inline-talk-html.mjs` / `build-talk.mjs`

## Global Constraints

- 公开入口仍为 `/talks/<slug>/slides/`（可 308 到内部 path）
- 内部 path：`slides-scenes` / `slides-deck`
- 站点专用 chrome：`data-export-strip`（返回链接、Analytics、主题切换）
- 保留：键盘提示、进度、tabs
- 署名仍由 inliner 按 policy 注入；credit=`蘇里`；assetOrigin=`https://yanguangjie.com`
- 候选 3（deck runtime）不在本轮
- 提交信息中文语义化前缀

## File Structure

| File | Responsibility |
|------|----------------|
| `src/pages/talks/[slug]/slides.astro` | 仅 redirect，零 deck import |
| `src/pages/talks/[slug]/slides-scenes.astro` | 只 ScenesDeck |
| `src/pages/talks/[slug]/slides-deck.astro` | 只 NotebookTabsDeck |
| `scripts/lib/export-policy.mjs` | 导出策略（origin、credit、stripAttr） |
| `scripts/lib/inline-talk-html.mjs` | 按 stripAttr 剥离；读 policy |
| `scripts/build-talk.mjs` | 按 template 读 slides-{template} |
| Deck Astro 文件 | 给站点专用 chrome 打 `data-export-strip` |

---

### Task 1: 拆路由

- [ ] 新建 `slides-scenes.astro` / `slides-deck.astro`（各自 getStaticPaths 过滤 template）
- [ ] 改写 `slides.astro` 为纯 redirect（308）
- [ ] `npm run build` 后检查：deck talk 的 slides HTML 不含 Scenes 的 global/theme 痕迹；scenes 反之
- [ ] Commit: `refactor: 按 template 拆分 talks slides 路由`

### Task 2: 导出策略 + strip 标记

- [ ] 新建 `export-policy.mjs`
- [ ] ScenesDeck / NotebookTabsDeck / ThemeToggle 或 Analytics 外包：`data-export-strip`
- [ ] Commit: `feat: 为 slides 导出接缝添加 data-export-strip 与导出策略`

### Task 3: inliner + build-talk + 测试

- [ ] inliner：删 `[data-export-strip]`；去掉对 `.hud-back` 等硬编码依赖（可保留为兜底或删除）
- [ ] `build-talk.mjs`：读 template，路径 `slides-${template === 'deck' ? 'deck' : 'scenes'}`
- [ ] 更新单元测试；`npm run test:talk-inline`；抽测 `build:talk`
- [ ] 更新 AGENT.md / CONTEXT.md / design spec
- [ ] Commit: `feat: inliner 消费导出接缝并按 template 定位产物`

## Spec coverage

| 共识项 | Task |
|--------|------|
| 2→1 顺序 | 1 then 2–3 |
| 切开资产 | 1 |
| 公开 /slides/ | 1 redirect |
| data-export-strip 列表 | 2 |
| export policy | 2–3 |
| build:talk 路径 | 3 |
| 候选 3 延后 | — |
