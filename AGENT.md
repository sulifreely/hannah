# AGENT.md

面向 AI 编码代理（以及人类协作者）的项目说明。改本仓库前先读完；**领域名词**见 [`CONTEXT.md`](./CONTEXT.md)。

## 项目概览

蘇里（严广杰 / sulifreely）的个人网站，部署在 Vercel，域名 `yanguangjie.com`。

- 框架：Astro 5（`output: static`）
- 内容：Markdown 集合（博客 + 演讲）
- 字体：Mulish（`@fontsource/mulish`）→ 霞鹜文楷 Lite → 系统中文兜底；代码 JetBrains Mono。字族栈见 `src/styles/global.css` 的 `--font-sans` / `--font-mono`
- 幻灯片 Markdown：`marked`；图表：`mermaid`（含图才懒加载，跟主题重渲染）
- 风格：极简、内容优先，明暗主题；正文 `--fg-body`，标题 `--fg`

## 常用命令

```bash
npm install                 # 公共 npm registry（见 .npmrc）
npm run dev                 # http://localhost:4321
npm run check               # astro check（类型门禁）
npm run build               # check + 构建到 dist/
npm run preview             # 预览构建产物
npm run build:talk -- <slug>  # 导出独立 HTML → dist-talk/<slug>.html
```

改完请跑通 `npm run build`（或至少 `npm run check`）。

## 目录结构

```
skills/                 personal skills（y-fable 等）
scripts/
  install-skills.sh     安装 skills 到 agent 技能目录
  build-talk.mjs        独立导出 CLI
  lib/
    export-policy.mjs   导出策略（署名 / origin / strip 属性）
    inline-talk-html.mjs  构建产物 → 单文件 HTML
src/
  content/
    blog/               博客
    talks/              演讲（scenes：正文即幻灯片；deck：见 deck.slides）
    config.ts           zod schema
  layouts/              BaseLayout / PostLayout
  components/
    Header / Footer / PostCard / TalkCard / ThemeToggle / LikeButton
    decks/
      ScenesDeck.astro / NotebookTabsDeck.astro
      notebook-tabs/    slide type 组件 + registry + primitives
  lib/
    deck/url-state.ts   ?scene=&beat= 共用状态
    format.ts / analytics.ts
  pages/
    index / blog / about / rss / 404
    talks/index.astro
    talks/[slug].astro              详情（「Open slides」按 template 直链）
    talks/[slug]/slides-scenes.astro
    talks/[slug]/slides-deck.astro
  styles/
    global.css
    decks/chrome.css / notebook-tabs.css
public/favicon.png / images/{blogs,talks}/
astro.config.mjs
```

## Skills 安装

`skills/` 下含 `SKILL.md` 的目录由 `scripts/install-skills.sh` 软链到 `~/.cursor/skills` 与 `~/.claude/skills`。

```bash
npm run install-skills              # 跳过已存在
npm run install-skills:force        # 覆盖同名链接
scripts/install-skills.sh --list | --dry-run | --uninstall
```

安装或改动 skill 后需**重载 Cursor / 重启 agent**。

## 内容写作约定

### 博客

`src/content/blog/` 新建 `.md`，文件名即 slug：

```md
---
title: 标题
date: 2026-06-28
description: 一句话摘要（列表与 RSS）
tags: [标签一, 标签二]   # 最多 3 个（zod .max(3)）
cover: /images/blogs/xxx.jpg   # 可选
draft: false                   # true 则不出现在列表/详情/RSS
---
```

- 列表按 `date` **倒序**；同一天多篇用带时间的 ISO（如 `2026-06-27T16:00:00+08:00`）区分，页面只显示到日。
- 正文标准 Markdown；代码块自动高亮并跟主题。

### 趣味性：emoji 与图表

服务于理解，点到为止。

**Emoji：** `##` 标题可前置一个贴合主题的 emoji；正文偶尔点缀；三级标题与列表默认不加。

**Mermaid：** 围栏 ` ```mermaid `，由 `remarkMermaid` → `<pre class="mermaid">`，客户端渲染。

- 中文 / 标点 / `<br/>` / emoji 的节点文案用双引号：`A["文案"]`
- 优先简单 `flowchart`；一篇 1～3 张为宜
- 自动跟主题；风格固定 `look: 'handDrawn'` + `handDrawnSeed: 1`（Comic Neue + 霞鹜）
- 语法错误不阻断页面，但请本地确认出图
- 同样适用于 Talks

### 演讲（Talks）

词表见 `CONTEXT.md`。在 `src/content/talks/` 新建 `.md`：frontmatter 同博客，另可选 `subtitle`、`event`，以及 `template`（`'scenes' | 'deck'`，缺省 `scenes`）。

详情页按 template 直链 `/talks/<slug>/slides-scenes/` 或 `.../slides-deck/`（**不要**再加中间 `/slides` 路由；两套引擎不得静态 import 进同一页面）。

| template | 写法 | 路由 / 引擎 |
|----------|------|-------------|
| `scenes`（默认） | 正文 Markdown；`---` 分页，`+++` 页内 beat | `slides-scenes` → ScenesDeck |
| `deck` | `deck.slides[]`（+ 可选 `deck.sections`）；Zod discriminated union 校验 | `slides-deck` → NotebookTabsDeck |

`deck` 示例见 `src/content/talks/execution-topology-in-skills.md`。当前 `type`：`title` / `quote` / `split` / `code` / `grid` / `chain` / `branch` / `bullets` / `table` / `diagram`。

新增 slide type 三处联动：`config.ts` schema → `notebook-tabs/*.astro` → `registry.ts`。组件优先复用 `notebook-tabs/primitives/`（`Md` / `SlideHead` / `Bullets` / `RefLinks`）。`diagram` 与博客同一套 Mermaid 配置，可直接复用博客图表源码。

**给已有 slide 加字段（如 `lead`）也要两处联动：`config.ts` schema + 对应 `*.astro`。** Zod 默认 **静默丢弃** schema 未声明的键，`astro check` / `build` 都不会报错——字段会「写了却不显示」，容易误判成图表/样式坏了。不同 slide type 的字段并不通用（例：`split` 原本无 `lead`，`grid`/`diagram` 有）。改动后务必在浏览器实测确认新内容真的渲染出来，别只依赖构建通过。

**独立导出：** `npm run build:talk -- <slug>` 读构建产物 `slides-{scenes|deck}/`，剥离 `[data-export-strip]`，注入署名，内联图/脚本；Google Fonts 留 CDN，自托管 webfont 改写到 `ASSET_ORIGIN`。细节在 `scripts/lib/export-policy.mjs`。

**Deck HTML 注意：** Analytics / 任何非 head 合法节点不要放进 `<head>`（无效内容会导致 Astro 丢掉 `<body class="deck-root|deck-body">`，整页样式失效）。站点专用 chrome 包在 body 内并打 `data-export-strip`。

### 图片

- 放 `public/images/{blogs,talks}/`，Markdown 用绝对路径（如 `/images/talks/foo.png`）
- 不做自动压缩；封面建议宽 1200～1600px、几百 KB 内

## 站点身份（保持一致）

- 显示名：蘇里
- 邮箱[站点公开]：sulifreely@gmail.com（`about.astro` 展示）
- 邮箱[个人]：sulifreely42@gmail.com
- 邮箱[工作]：yanguangjie@bytedance.com
- GitHub：https://github.com/sulifreely
- `site`：https://yanguangjie.com（`astro.config.mjs` → sitemap / RSS / canonical / og）

## 部署

推送 GitHub `main` → Vercel 自动构建。仓库：https://github.com/sulifreely/hannah

## 约定与注意

- **类型门禁：** `npm run check` / `npm run build` 须 `0 errors`；`.astro` / `.ts` / 内联 `<script>` 都在范围内。`astro.config.mjs` 保留 `// @ts-check`，remark 等用 JSDoc（mdast 来自 `@types/mdast`）。
- 包管理走公共 npm（`.npmrc`），不切内网源。
- 不提交 `dist/`、`dist-talk/`、`node_modules/`（已 gitignore）。
- 身份信息变更时全站一致（头、脚、SEO、RSS、About）。
- 提交信息：中文 + 语义化前缀（feat / fix / chore / content 等）。
- **响应式：** 至少覆盖手机 / 平板 / PC，用设备模拟或改窗口自查。
- 新用户行为埋点：先问是否要上报；要则在 `src/lib/analytics.ts` 加类型化事件，组件里不裸调 `track()`。
- **`global.css` 禁止宽泛标签选择器**（`body` / `html` / `pre` 等无 class）：会波及全屏 deck。结构性样式写进 layout 的 scoped `<style>`；若必须写全局标签规则，给 deck 侧补显式 reset（如 `.deck-root pre.mermaid { border:none; padding:0; border-radius:0 }`）。
