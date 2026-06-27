# AGENT.md

面向 AI 编码代理（以及人类协作者）的项目说明。修改本仓库前请先读完本文件。

## 项目概览

蘇里（严广杰 / sulifreely）的个人网站，部署在 Vercel，域名 `yanguangjie.com`。

- 框架：Astro 5（静态站点，`output: static`）
- 内容：Markdown 内容集合（博客 + 演讲）
- 字体：西文 Monaco（macOS 系统等宽，优先）→ 自托管 JetBrains Mono（`@fontsource/jetbrains-mono`，跨平台兜底）→ 中文霞鹜文楷 Lite（`lxgw-wenkai-lite-webfont`，自托管、按 unicode-range 分片）。完整字族栈见 `src/styles/global.css` 的 `--font-sans`；正文关闭连字，代码块保留
- 幻灯片渲染：`marked`
- 风格：极简、内容优先，支持明暗主题

## 常用命令

```bash
npm install      # 安装依赖（使用公共 npm registry，见 .npmrc）
npm run dev      # 本地开发，http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

修改后请至少跑通 `npm run build`，确保无报错。

## 目录结构

```
src/
  content/
    blog/            博客文章（Markdown）
    talks/           演讲（Markdown，正文即幻灯片源）
    config.ts        内容集合的 zod schema
  layouts/
    BaseLayout.astro 站点骨架（head/SEO/主题/页头页脚）
    PostLayout.astro 博客文章排版
  components/         Header / Footer / PostCard / ThemeToggle
  pages/
    index.astro              首页（博客列表）
    blog/[...slug].astro     博客详情
    talks/index.astro        演讲列表
    talks/[slug].astro       演讲详情
    talks/[slug]/slides.astro 全屏幻灯片引擎
    about.astro              关于
    rss.xml.js               RSS
    404.astro
  styles/global.css  全局样式与明暗主题 CSS 变量
public/
  favicon.png        头像 + favicon
  images/
    blogs/           博客用图（按需新建）
    talks/           演讲用图
astro.config.mjs     site 域名与集成（mdx / sitemap / 代码高亮）
```

## 内容写作约定

### 博客

在 `src/content/blog/` 新建 `.md`，文件名即 URL slug。frontmatter：

```md
---
title: 标题
date: 2026-06-28
description: 一句话摘要（用于列表与 RSS）
tags: [标签一, 标签二]
cover: /images/blogs/xxx.jpg   # 可选封面图
draft: false                    # true 则不在列表/详情/RSS 中出现
---
```

- 列表按 `date` 倒序。
- 正文是标准 Markdown，代码块自动高亮并跟随主题。

### 演讲（Talks）

在 `src/content/talks/` 新建 `.md`。frontmatter 同博客，外加可选 `subtitle`、`event`。
正文即幻灯片源，遵循两个分隔约定：

- `---`（独占一行）分隔**每一页**（scene）
- `+++`（独占一行）分隔**页内渐进显示步骤**（beat）

幻灯片支持 Markdown 的标题、列表、引用、代码块、图片。详情页有 `Open slides →` 进入
`/talks/<slug>/slides`。幻灯片引擎支持键盘（←/→/Space/Home/End/F/Esc）、点击翻页、
`?scene=&beat=` URL 同步与进度计数。

### 图片

- 统一放在 `public/images/` 下，按 `blogs/` 与 `talks/` 分类。
- Markdown / frontmatter 中用绝对路径引用，例如 `/images/talks/foo.png`。
- 当前不做自动压缩，请上传前自行压到合理尺寸（封面宽 1200~1600px、几百 KB 内）。

## 站点身份（保持一致）

- 显示名：蘇里
- 邮箱：yanguangjie@bytedance.com
- GitHub：https://github.com/sulifreely
- 站点 `site`：https://yanguangjie.com（见 `astro.config.mjs`，影响 sitemap/RSS/canonical/og:image）

## 部署

推送到 GitHub `main` 分支后，Vercel 自动构建部署（框架自动识别为 Astro，无需额外配置）。
GitHub 仓库：https://github.com/sulifreely/hannah

## 约定与注意

- 包管理走公共 npm registry（项目级 `.npmrc`），不要切回内网源。
- 不要把构建产物 `dist/` 或 `node_modules/` 提交（已在 `.gitignore`）。
- 改名 / 身份信息变更时，注意全站一致（页头、页脚、SEO、RSS、About）。
- 提交信息使用中文、语义化前缀（feat/fix/chore/content 等）。
