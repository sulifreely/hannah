# 博客主题改版：纸感复古（设计文档）

日期：2026-07-04
状态：已确认，待实施

## 背景

站点当前风格是极简、灰阶为主的克制风（黑白双主题，无强调色）。为了让站点在保持"内容优先、克制"的前提下更有个人风格记忆点，调研了社区里公认做得好的技术博客/个人站风格（贼歪 varzy.me 的极致克制、Shiro 主题的纸感朱红、Gwern.net / Remarque 的排版优先编辑风、2026 年"极简 2.0 + 大胆排版"趋势），做了 4 套静态视觉 demo（`design-mockups/theme-{1..4}-*.html`）供对比，最终选定 **主题二：纸感复古**。

设计目标：暖调纸质背景 + 朱红点缀强调色，标题带衬线气质，让站点读起来更像一本"读物"而不是一个"工具页面"，同时零新增字体加载成本、不改动内容结构与交互逻辑。

## 视觉规范

### 色板（CSS 自定义属性，替换 `src/styles/global.css` 中 `:root` 与 `:root[data-theme="dark"]`）

浅色（默认）：

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `#f6f1e6` | 页面背景（暖纸底） |
| `--paper` | `#fbf7ee` | Header/Footer/悬浮控件背景（比页面背景略浅的"纸片"） |
| `--fg` | `#2a2116` | 标题、强调文字 |
| `--fg-body` | `#4c4132` | 正文 |
| `--fg-muted` | `#8a7a5f` | 摘要、次要文字 |
| `--fg-subtle` | `#b3a488` | 日期、meta 信息 |
| `--border` | `#e2d5b8` | 分隔线、卡片描边 |
| `--accent` | `#c1440e` | 朱红强调色：链接、标签、当前导航项、引用左边框 |
| `--accent-hover` | `#9c360a` | 强调色 hover 态 |
| `--tag-bg` | `#efe3c8` | 标签底色、引用块底色 |
| `--code-bg` | `#f0e6d0` | 行内代码/代码块背景 |

深色（`data-theme="dark"`）：

| Token | 值 |
|---|---|
| `--bg` | `#1b1712` |
| `--paper` | `#211c16` |
| `--fg` | `#ece3d2` |
| `--fg-body` | `#d0c4ac` |
| `--fg-muted` | `#a3927a` |
| `--fg-subtle` | `#6f6350` |
| `--border` | `#332c22` |
| `--accent` | `#e0793f`（比浅色调亮，保证暗背景下对比度） |
| `--accent-hover` | `#f09257` |
| `--tag-bg` | `#2a241c` |
| `--code-bg` | `#241f18` |

`--selection` 建议跟随新色板调整为暖色调（如浅色 `#f0dcc4`，深色 `#4a3420`），避免和冷色蓝调选中色冲突。

### 字体（不引入新 webfont）

新增一个字体角色 token：

```css
--font-serif: "LXGW WenKai Lite", Georgia, "Songti SC", serif;
```

- **不下载 Noto Serif SC 或其他新衬线字体**——CJK 衬线字体子集体积很大，与项目"自托管字体做子集裁剪、控制体积"的原则冲突（见 `AGENT.md`）。
- 标题（中英混排）复用已经自托管、按 unicode-range 分片加载的霞鹜文楷 Lite（`lxgw-wenkai-lite-webfont`，已在 `BaseLayout.astro` 中引入）——它本身含拉丁字形，带毛笔/衬线气质，中英文标题都会呈现统一的手写衬线感，零额外加载。
- `Georgia → Songti SC → serif` 仅作为霞鹜文楷 Lite 加载失败时的系统兜底，正常情况下不会被使用到。
- 正文西文继续使用现有 Mulish，不受影响。
- 代码块/mono 场景继续使用现有 JetBrains Mono，不受影响。
- Mermaid 手绘风图表（Comic Neue + 霞鹜文楷、`look: 'handDrawn'`）不改动——纸感与手绘风格气质一致。

### 排版细节

- 标题（`h1`/`h2`/`h3`，站点级与 `.prose` 内）字体切换为 `var(--font-serif)`，字重不变。
- 标签（tag）从纯文字改为描边/浅底小药丸：`color: var(--accent); background: var(--tag-bg); padding: .1em .55em; border-radius: 3px;`
- 日期/meta 信息使用现有 `--font-mono`，小号（`.8rem`），颜色 `--fg-subtle`。
- 文章 H1 下方增加一条朱红短下划线（`text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 3px;`，仅包裹标题文字宽度，不贯穿全宽）。实现上用 `text-decoration` 而不是 `border-bottom` + `inline-block`——后者在标题换行成宽度不等的两行时，下划线会按最宽的那一行撑满宽度、却只出现在最后一行下方，看起来像一条不相关的横线；`text-decoration` 会按每一行文字的实际宽度分别画线，长标题换行时表现更自然（已用窄视口下的长标题验证过）。
- `blockquote` 改为浅底 + 朱红左边框 + 右侧圆角：`background: var(--tag-bg); border-left: 3px solid var(--accent); border-radius: 0 6px 6px 0;`
- `.prose h2` 前增加一个朱红圆点装饰（`::before { content: "· "; color: var(--accent); }`），弱化"目录感"、强化"读物感"。
- 缩略图 / 封面图圆角从当前 12–14px 收窄到 4px，边框保留 1px `--border`，列表缩略图额外加一点"明信片"投影（`box-shadow: 3px 3px 0 var(--border)`）。
- **不改动全局 `a` 标签的默认颜色**（保持 `color: inherit`）——朱红只用在下面这几个明确的位置，避免品牌字、文章标题、页脚 RSS 链接等"继承正文色"的地方被意外染红：
  - 标签（tag）文字与描边
  - 当前导航项（nav active）
  - 引用块左边框
  - 文章 H1 下方短分隔线
  - 目录（TOC）当前高亮项
  - 文章卡片/标题的 hover 态（`:hover` 时从墨色过渡到 `--accent-hover`，复用已有的 `--accent-hover` 变量）

## 涉及文件与改动范围

只涉及样式层（CSS 变量 + 少量结构性 class 调整），不改数据结构、不改路由、不改交互逻辑：

- `src/styles/global.css`：替换 `:root` / `:root[data-theme="dark"]` 全部色板变量，新增 `--font-serif`、`--paper` 两个 token，并给全局 `h1~h4` 加上 `font-family: var(--font-serif)`。`blockquote` 的样式实际定义在 `PostLayout.astro` 的 `.prose` 作用域内（不在 global.css），会在下面单独列出；`:not(pre) > code` 与 `a` 的规则本身不改，颜色变化通过 token 自动生效。
- `src/components/Header.astro`：brand 与当前导航项应用 `--font-serif` / `--accent`。
- `src/components/PostCard.astro`：标签样式、缩略图圆角与投影；同时修正缩略图 `img` 目前硬编码的 `background: #fff`（改为 `var(--paper)`），否则暗色模式下透明底图会露出刺眼的白色。
- `src/layouts/PostLayout.astro`：文章 H1 字体与下划线、`.prose` 内 h2 装饰、blockquote、tag 样式；`.toc` 侧栏 active 态颜色跟随新 `--accent`。
- `src/components/Footer.astro`：颜色变量自动生效，预期不需要改代码（若有硬编码颜色需要替换为变量）。
- `src/components/ThemeToggle.astro`：颜色变量自动生效，预期不需要改代码。
- `src/pages/index.astro`：intro 区域颜色变量自动生效，预期不需要改代码。

## 不改动的部分（明确排除范围）

- Mermaid 图表配色（继续跟随明暗主题用 `neutral`/`dark`，手绘风 `handDrawn` 不变）
- 字体加载列表（不新增 `<link>` 或 `@fontsource` 依赖）
- 页面结构、路由、内容 schema（`content/config.ts`）
- PhotoSwipe 图片预览逻辑
- 目录（TOC）交互逻辑，仅改颜色

## 验证计划

- `npm run dev` 本地检查首页、文章详情页在明暗两种主题下的视觉效果，对照 `design-mockups/theme-2-paper.html` 的明暗截图（`design-mockups/screenshots/theme-2-paper-{light,dark}.png`）核对色板与字体是否一致。
- 检查含 mermaid 图表的文章（如 `soft-orchestration-in-skills.md`）确认图表容器边框颜色跟随新 `--border`，图表本身不受影响。
- 检查代码块、表格、图片放大预览（PhotoSwipe）在新色板下的可读性。
- `npm run check` / `npm run build` 确保无类型错误（本次改动不涉及 TS，但仍需跑通门禁）。
- 视觉自查：链接可点击性（颜色对比度）、暗色模式下朱红是否刺眼、标签在深色背景下的可读性。

## 参考

- `design-mockups/theme-2-paper.html`（可视化 demo 源文件）
- `design-mockups/screenshots/theme-2-paper-light.png`、`theme-2-paper-dark.png`
- 灵感来源：Shiro 主题（纸感 + 朱红点缀）、贼歪 varzy.me（克制排版）、AGENT.md 中关于自托管字体子集裁剪的约定
