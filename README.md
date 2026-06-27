# yanguangjie.com

言光杰的个人博客，基于 [Astro](https://astro.build) 构建。极简、内容优先，支持深色模式、RSS 与 sitemap。

## 本地开发

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 写文章

在 `src/content/blog/` 下新建 `.md` 文件，frontmatter 示例：

```md
---
title: 文章标题
date: 2026-06-27
description: 一句话摘要，会显示在列表与 RSS 中。
tags:
  - 标签一
  - 标签二
draft: false
---

正文（Markdown）。
```

- `draft: true` 的文章不会出现在列表、文章页与 RSS 中。
- 列表按 `date` 倒序排列。

## 目录结构

```
src/
  content/blog/      文章 Markdown
  content/config.ts  文章字段校验（zod schema）
  layouts/           BaseLayout（站点骨架）、PostLayout（文章排版）
  components/         Header / Footer / PostCard / ThemeToggle
  pages/             index、blog/[...slug]、about、rss.xml.js、404
  styles/global.css  全局样式与明暗主题变量
public/              favicon、robots.txt 等静态资源
astro.config.mjs     站点域名与集成（mdx / sitemap / 代码高亮）
```

## 部署

推送到 GitHub 后在 [Vercel](https://vercel.com) 导入仓库即可自动构建部署，框架会被识别为 Astro（无需额外配置）。随后在 Vercel 项目中添加自定义域名 `yanguangjie.com`，并按提示在域名注册商处配置 DNS 记录。
