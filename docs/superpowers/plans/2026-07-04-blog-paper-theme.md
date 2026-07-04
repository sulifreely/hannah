# 博客纸感复古主题改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把站点从当前的黑白极简风改为「纸感复古」主题——暖纸色背景 + 朱红点缀强调色 + 复用现有霞鹜文楷字体的衬线标题，明暗双主题都要覆盖。

**Architecture:** 纯样式层改动。只替换 `src/styles/global.css` 里的 CSS 自定义属性（色板 token + 新增 `--font-serif`/`--paper`）与少量全局规则，再对 `Header.astro` / `PostCard.astro` / `PostLayout.astro` 三个组件做局部样式微调（标签样式、标题下划线、TOC 高亮、引用块、图片圆角）。不改数据结构、路由、交互逻辑；Footer.astro / ThemeToggle.astro / index.astro 因为已经是纯变量驱动，预期不需要改代码，只需要在核查阶段确认视觉效果正确。

**Tech Stack:** Astro 5、纯 CSS 自定义属性（无 CSS 框架），无自动化测试套件。

**关于验证方式的说明：** 本项目是纯静态 Astro 站点，没有 Jest/Vitest 等测试框架，样式改动无法写传统单元测试断言。因此每个任务的"验证"步骤是：本地 `npm run dev` 打开对应页面，明暗两种主题各看一遍，和 `design-mockups/screenshots/theme-2-paper-{light,dark}.png` 做对照；最后统一跑 `npm run check` / `npm run build` 保证类型门禁通过。

---

### Task 1: 替换全局色板与字体 token

**Files:**
- Modify: `src/styles/global.css:1-33`（`:root` 与 `:root[data-theme="dark"]` 两个变量块）
- Modify: `src/styles/global.css`（新增 `h1,h2,h3,h4` 的 `font-family`，`a`/`a:hover` 规则不变）

- [x] **Step 1: 替换色板变量块**

把文件开头的两段 `:root` 变量替换为：

```css
:root {
  --max-width: 836px;
  --font-sans: Mulish, "LXGW WenKai Lite", "PingFang SC", "Microsoft YaHei",
    sans-serif;
  --font-serif: "LXGW WenKai Lite", Georgia, "Songti SC", serif;
  --font-mono: "SF Mono", SFMono-Regular, ui-monospace, "JetBrains Mono", Menlo,
    Consolas, monospace;

  --bg: #f6f1e6;
  --paper: #fbf7ee;
  --fg: #2a2116;
  --fg-body: #4c4132;
  --fg-muted: #8a7a5f;
  --fg-subtle: #b3a488;
  --border: #e2d5b8;
  --accent: #c1440e;
  --accent-hover: #9c360a;
  --tag-bg: #efe3c8;
  --code-bg: #f0e6d0;
  --selection: #f0dcc4;
}

:root[data-theme="dark"] {
  --bg: #1b1712;
  --paper: #211c16;
  --fg: #ece3d2;
  --fg-body: #d0c4ac;
  --fg-muted: #a3927a;
  --fg-subtle: #6f6350;
  --border: #332c22;
  --accent: #e0793f;
  --accent-hover: #f09257;
  --tag-bg: #2a241c;
  --code-bg: #241f18;
  --selection: #4a3420;
}
```

- [x] **Step 2: 给全站标题加衬线字体**

找到：

```css
h1,
h2,
h3,
h4 {
  color: var(--fg);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
}
```

改成：

```css
h1,
h2,
h3,
h4 {
  color: var(--fg);
  font-family: var(--font-serif);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
}
```

**不要改动** `a { color: inherit; }` 和 `a:hover` 规则——保持链接默认继承正文色，朱红只用在后面任务里明确列出的几个位置（标签、当前导航、引用边框、H1 下划线、TOC 高亮），避免品牌字/标题/页脚链接被意外染色。

- [x] **Step 3: 视觉核查**

运行：

```bash
npm run dev
```

打开 `http://localhost:4321`，用页头右上角的 ◐ 按钮切换明暗主题，确认：
- 背景变成暖纸色（浅色 `#f6f1e6`，深色 `#1b1712`）
- 所有 `h1`~`h4` 标题变成衬线字体（中文标题视觉上几乎无变化，因为霞鹜文楷本来就有衬线气质；主要看西文/数字标题是否切到了 Georgia 兜底）
- 页面上暂时还没有红色强调色出现（本任务只换色板，任务 2~4 才会用到 `--accent`），这是预期状态

- [x] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "style: 博客主题切换为纸感复古色板"
```

---

### Task 2: Header 品牌字体与当前导航态

**Files:**
- Modify: `src/components/Header.astro:32-70`（`<style>` 块）

- [x] **Step 1: 给品牌字设置衬线字体与显式墨色**

找到：

```css
  .brand {
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: 0.01em;
  }
```

改成：

```css
  .brand {
    font-family: var(--font-serif);
    color: var(--fg);
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: 0.01em;
  }
```

（显式设置 `color: var(--fg)` 是为了防止未来任何全局链接色规则变化时品牌字被意外染色——当前虽然 `a` 的默认色没变，但显式声明更稳妥、也和设计文档里"品牌字保持墨色"的决策对齐。）

- [x] **Step 2: 当前导航项改用强调色**

找到：

```css
  .nav-link.active {
    color: var(--fg);
    font-weight: 600;
  }
```

改成：

```css
  .nav-link.active {
    color: var(--accent);
    font-weight: 700;
  }
```

- [x] **Step 3: 视觉核查**

`npm run dev` 打开首页与 `/about`，确认：
- 页头品牌"蘇里"是衬线字体、墨色（不是红色）
- 当前所在页面对应的导航项（如首页对应"博客"）文字变成朱红色
- 明暗两种主题下都检查一遍

- [x] **Step 4: Commit**

```bash
git add src/components/Header.astro
git commit -m "style: 页头品牌改用衬线字体，当前导航项改用强调色"
```

---

### Task 3: PostCard 标签样式、缩略图圆角与图片背景修正

**Files:**
- Modify: `src/components/PostCard.astro:42-113`（`<style>` 块）

- [x] **Step 1: 标签改成描边药丸样式，meta 用等宽字体**

找到：

```css
  .meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--fg-subtle);
    margin-bottom: 0.5rem;
  }
  .tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .tag {
    color: var(--fg-muted);
  }
```

改成：

```css
  .meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--fg-subtle);
    margin-bottom: 0.5rem;
  }
  .tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .tag {
    color: var(--accent);
    background: var(--tag-bg);
    padding: 0.1em 0.55em;
    border-radius: 3px;
  }
```

- [x] **Step 2: 缩略图圆角收窄并加"明信片"投影**

找到：

```css
  .thumb {
    flex-shrink: 0;
    display: block;
    width: clamp(180px, 30vw, 260px);
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .thumb img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: contain;
    background: #fff;
  }
```

改成：

```css
  .thumb {
    flex-shrink: 0;
    display: block;
    width: clamp(180px, 30vw, 260px);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border);
    box-shadow: 3px 3px 0 var(--border);
  }
  .thumb img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: contain;
    background: var(--paper);
  }
```

（`background: #fff` 是硬编码的白色，暗色模式下透明底的图片会露出刺眼白块，这里一并修正为跟随主题的 `--paper`。）

- [x] **Step 3: 两处响应式圆角同步收窄**

找到：

```css
  @media (max-width: 680px) {
    .thumb {
      width: 136px;
    }
  }
  @media (max-width: 480px) {
    .post-card {
      gap: 1rem;
    }
    .thumb {
      width: 112px;
      border-radius: 12px;
    }
  }
```

改成：

```css
  @media (max-width: 680px) {
    .thumb {
      width: 136px;
    }
  }
  @media (max-width: 480px) {
    .post-card {
      gap: 1rem;
    }
    .thumb {
      width: 112px;
      border-radius: 4px;
    }
  }
```

- [x] **Step 4: 视觉核查**

`npm run dev` 打开首页，确认：
- 标签变成朱红文字 + 浅底描边的小药丸
- 日期/标签用等宽字体、字号更小
- 缩略图圆角变小，右下方出现一条细的"投影"边
- 缩小浏览器窗口到手机宽度，确认缩略图圆角在小屏下也是 4px（不是残留的旧 12px）
- 明暗两种主题都检查一遍，尤其确认缩略图透明区域背景不再是刺眼的纯白

- [x] **Step 5: Commit**

```bash
git add src/components/PostCard.astro
git commit -m "style: 文章卡片标签改为药丸样式，修正缩略图圆角与背景色"
```

---

### Task 4: PostLayout 标题下划线、TOC 高亮、引用块与图片圆角

**Files:**
- Modify: `src/layouts/PostLayout.astro:83-161`（第一个 `<style>` 块：`.toc a.active`、`.post-header h1`、`.cover`、`.tag`）
- Modify: `src/layouts/PostLayout.astro:163-295`（`<style is:global>` 块：`.prose h2`、`.prose blockquote`、`.prose img`）

- [x] **Step 1: TOC 当前高亮项改用强调色**

找到：

```css
  .toc a.active {
    color: var(--fg);
    border-left-color: var(--fg);
  }
```

改成：

```css
  .toc a.active {
    color: var(--accent);
    border-left-color: var(--accent);
  }
```

- [x] **Step 2: 封面图圆角收窄**

找到：

```css
  .cover {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 12px;
    border: 1px solid var(--border);
    margin-bottom: 2.5rem;
  }
```

改成：

```css
  .cover {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 4px;
    border: 1px solid var(--border);
    margin-bottom: 2.5rem;
  }
```

- [x] **Step 3: 文章头部 meta 用等宽字体，标签同步改成药丸样式**

找到：

```css
  .meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--fg-subtle);
    margin-bottom: 0.6rem;
  }
  .tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .tag {
    color: var(--fg-muted);
  }
```

改成：

```css
  .meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--fg-subtle);
    margin-bottom: 0.6rem;
  }
  .tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .tag {
    color: var(--accent);
    background: var(--tag-bg);
    padding: 0.1em 0.55em;
    border-radius: 3px;
  }
```

- [x] **Step 4: H1 加朱红短下划线**

找到：

```css
  .post-header h1 {
    margin: 0;
    font-size: clamp(2rem, 1.3rem + 2.8vw, 2.6rem);
    font-weight: 750;
    line-height: 1.18;
    letter-spacing: -0.02em;
  }
```

改成：

```css
  .post-header h1 {
    margin: 0;
    padding-bottom: 0.5rem;
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 3px;
    text-underline-offset: 0.3em;
    font-size: clamp(2rem, 1.3rem + 2.8vw, 2.6rem);
    font-weight: 750;
    line-height: 1.18;
    letter-spacing: -0.02em;
  }
```

> **实施记录（Task 5 视觉核查阶段发现并修正）：** 最初按 `display: inline-block; border-bottom: 3px solid var(--accent);` 实现时，在窄视口下长标题换行成两行不等宽的文本时，下划线会按最宽的一行撑满宽度、却画在最后一行下方，看起来像一条不相关的横线（Task 4 的代码质量审查已提前预警了这个风险）。改成 `text-decoration` 系列属性后，浏览器会按每一行文字的实际宽度分别画下划线，单行标题和多行标题下都表现自然，已用窄视口截图验证。

- [x] **Step 5: `.prose h2` 加朱红圆点装饰**

找到：

```css
  .prose h2 {
    margin-top: 3rem;
    margin-bottom: 1rem;
    font-size: 1.75rem;
    font-weight: 750;
    line-height: 1.3;
    scroll-margin-top: 1.5rem;
  }
```

改成：

```css
  .prose h2 {
    margin-top: 3rem;
    margin-bottom: 1rem;
    font-size: 1.75rem;
    font-weight: 750;
    line-height: 1.3;
    scroll-margin-top: 1.5rem;
  }
  .prose h2::before {
    content: "· ";
    color: var(--accent);
  }
```

- [x] **Step 6: 引用块改为浅底 + 朱红左边框**

找到：

```css
  .prose blockquote {
    margin: 1.75rem 0;
    padding: 0.5rem 0 0.5rem 1.3rem;
    border-left: 3px solid var(--fg-subtle);
    color: var(--fg);
    font-weight: 450;
  }
```

改成：

```css
  .prose blockquote {
    margin: 1.75rem 0;
    padding: 0.75rem 1.25rem;
    background: var(--tag-bg);
    border-left: 3px solid var(--accent);
    border-radius: 0 6px 6px 0;
    color: var(--fg);
    font-weight: 450;
  }
```

- [x] **Step 7: 正文图片圆角收窄，和封面/缩略图统一**

找到：

```css
  .prose img {
    border-radius: 8px;
  }
```

改成：

```css
  .prose img {
    border-radius: 4px;
  }
```

- [x] **Step 8: 视觉核查**

`npm run dev` 打开 `soft-orchestration-in-skills` 这篇文章（含 mermaid 图表、代码块、引用块、多级标题），确认：
- 文章标题下方出现朱红短分隔线
- 二级标题前出现朱红圆点
- 引用块变成浅色底 + 朱红左边框 + 右侧圆角
- 桌面宽屏下右侧目录（TOC）当前阅读位置对应项是朱红色，点击目录项跳转后高亮也是朱红色
- 封面图与正文内图片圆角变小（4px）
- mermaid 图表容器边框颜色跟随新的 `--border`（暖色边框），图表本身手绘风格不受影响——点开图表确认可以正常渲染、放大预览正常
- 明暗两种主题都检查一遍

- [x] **Step 9: Commit**

```bash
git add src/layouts/PostLayout.astro
git commit -m "style: 文章详情页适配纸感复古主题（标题下划线、目录高亮、引用块、图片圆角）"
```

---

### Task 5: 全站核查与类型门禁

**Files:**
- 无新增改动，仅核查以下文件在新色板下的表现（预期无需改代码）：
  - `src/components/Footer.astro`
  - `src/components/ThemeToggle.astro`
  - `src/pages/index.astro`
  - `src/pages/about.astro`
  - `src/pages/404.astro`
  - `src/pages/talks/index.astro`、`src/pages/talks/[slug].astro`、`src/pages/talks/[slug]/slides.astro`

- [x] **Step 1: 逐页视觉核查**

`npm run dev` 依次打开：首页 `/`、文章详情页（两篇都看一次）、`/about`、`/talks`、`/talks/<slug>`、`/talks/<slug>/slides`、`/404`（随便访问一个不存在路径触发），每页明暗各看一次，确认：
- 没有遗留的纯白/纯黑硬编码色块（尤其检查幻灯片引擎 `slides.astro`，它可能有独立的背景色设定）
- Footer 的 RSS 链接、版权文字颜色正常（应该还是柔和的 `--fg-subtle`，不应该变成朱红色）
- ThemeToggle 图标颜色随主题正常切换
- 代码块、表格、行内代码背景色跟随新 `--code-bg`/`--tag-bg`，可读性正常
- 图片放大预览（PhotoSwipe）背景色正常（用的是 `--code-bg`，跟随主题）

如果发现某个页面有硬编码颜色没有跟随新主题，记录下来，回到对应文件补一个使用 CSS 变量的修正（属于本任务范围内的收尾修正，不需要单独开新任务）。

- [x] **Step 2: 类型检查与构建门禁**

```bash
npm run check
```

期望输出：`0 errors`

```bash
npm run build
```

期望：构建成功，无报错（`npm run build` 内部已经包含 `astro check`）。

- [x] **Step 3: 对照设计稿做最终视觉比对**

把本地页面截图和 `design-mockups/screenshots/theme-2-paper-light.png`、`theme-2-paper-dark.png` 并排比对，确认色板、标签样式、标题下划线、引用块风格与设计稿一致。

- [x] **Step 4: Commit（若 Step 1 有收尾修正）**

```bash
git add -A
git commit -m "style: 纸感复古主题全站核查收尾"
```

如果 Step 1 没有发现任何问题，跳过这个 commit。

---

## 完成标准

- [x] `npm run check` 与 `npm run build` 均无报错
- [x] 首页、文章详情页、关于页、演讲相关页面在明暗两种主题下视觉均符合设计文档 `docs/superpowers/specs/2026-07-04-blog-paper-theme-design.md`
- [x] mermaid 图表、代码高亮、图片预览等既有功能未被破坏
- [x] `design-mockups/` 目录下的静态 demo 文件保留（作为设计参考留档，不影响构建）

## 实施完成记录

全部 5 个任务已在 worktree `.worktrees/blog-paper-theme`（分支 `feature/blog-paper-theme`）内按 subagent-driven-development 完成，每个任务均经过 implementer → spec 合规审查 → 代码质量审查 三阶段：

- `8eb966d` style: 博客主题切换为纸感复古色板
- `6bf93ac` style: 页头品牌改用衬线字体，当前导航项改用强调色
- `cc06009` style: 文章卡片标签改为药丸样式，修正缩略图圆角与背景色
- `bca3777` style: 文章详情页适配纸感复古主题（标题下划线、目录高亮、引用块、图片圆角）
- `ef5612c` fix: 文章标题下划线改用 text-decoration，修正长标题换行时的显示问题（Task 5 视觉核查阶段发现并修正，同样经过代码质量审查）

**Task 5 视觉核查覆盖：** 首页、两篇文章详情页（含 mermaid 图表、代码块、引用块、TOC）、关于页、演讲列表页、演讲详情页、幻灯片页、404 页，明暗双主题各看一遍；用真实浏览器（Playwright）而不是纯代码审查完成，发现并修复了一处 H1 换行显示问题。

**已知的、明确不在本次范围内的观察项（供后续参考，未修改代码）：**
- `/talks` 列表页与详情页的标签（tag）渲染是独立组件，未采用本次的"药丸"样式，仍是纯文字 + `#` 前缀（设计文档范围只覆盖了 `PostCard.astro`/`PostLayout.astro`，未涉及 talks 相关页面）。
- 文章卡片/详情页标签仍保留 `#` 前缀（如 `#AI`），与早期设计稿截图里的纯文字标签样式略有差异；这是刻意维持"仅改样式、不改标记结构"的范围决策，如果之后想去掉 `#`，需要单独改动模板标记（不只是 CSS）。
