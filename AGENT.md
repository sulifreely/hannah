# AGENT.md

面向 AI 编码代理（以及人类协作者）的项目说明。修改本仓库前请先读完本文件。

## 项目概览

蘇里（严广杰 / sulifreely）的个人网站，部署在 Vercel，域名 `yanguangjie.com`。

- 框架：Astro 5（静态站点，`output: static`）
- 内容：Markdown 内容集合（博客 + 演讲）
- 字体：正文西文用 Mulish（自托管 `@fontsource/mulish`，权重 400/600/700/800）→ 中文霞鹜文楷 Lite（`lxgw-wenkai-lite-webfont`，自托管、按 unicode-range 分片）→ `PingFang SC` / `Microsoft YaHei` 系统兜底；代码块用 JetBrains Mono（`@fontsource/jetbrains-mono`）。完整字族栈见 `src/styles/global.css` 的 `--font-sans` / `--font-mono`；正文关闭连字，代码块保留
- 幻灯片渲染：`marked`
- 图表：`mermaid`，仅在文章含图表时由客户端按需懒加载，并跟随明暗主题重渲染
- 风格：极简、内容优先，支持明暗主题；正文文字偏柔和（`--fg-body`），标题更深更重（`--fg`）以拉开层级

## 常用命令

```bash
npm install      # 安装依赖（使用公共 npm registry，见 .npmrc）
npm run dev      # 本地开发，http://localhost:4321
npm run check    # 类型检查（astro check，等价于「tslint」门禁）
npm run build    # 先 astro check 再构建到 dist/（类型不通过则构建失败）
npm run preview  # 预览构建产物
```

修改后请跑通 `npm run build`，确保无报错。

## 目录结构

```
skills/
  personal/          y-fable, y-writer, y-thought, y-share
scripts/
  install-skills.sh  安装 skills 到 agent 技能目录
src/
  content/
    blog/            博客文章（Markdown）
    talks/           演讲（Markdown；template: scenes 正文即幻灯片源，deck 见下方 deck.slides）
    config.ts        内容集合的 zod schema
  layouts/
    BaseLayout.astro 站点骨架（head/SEO/主题/页头页脚/sticky footer）
    PostLayout.astro 博客文章排版
  components/
    Header / Footer / PostCard / TalkCard / ThemeToggle
    decks/
      ScenesDeck.astro       template: scenes 的幻灯片引擎
      NotebookTabsDeck.astro template: deck 的幻灯片引擎（Notebook Tabs 视觉风格）
      notebook-tabs/         deck 各 slide type 的渲染组件 + registry.ts + primitives/
  lib/
    deck/url-state.ts 两套幻灯片引擎共用的 ?scene=&beat= URL 状态
    format.ts         formatDate 等共享格式化工具
    analytics.ts       类型化埋点事件
  pages/
    index.astro              首页（博客列表）
    blog/[...slug].astro     博客详情
    talks/index.astro        演讲列表
    talks/[slug].astro       演讲详情
    talks/[slug]/slides.astro 全屏幻灯片引擎（按 template 分发到 decks/ 下两种组件）
    about.astro              关于
    rss.xml.js               RSS
    404.astro
  styles/
    global.css       全局样式与明暗主题 CSS 变量
    decks/
      chrome.css         两套幻灯片引擎共用的角落元素间距/层级变量
      notebook-tabs.css   template: deck 的视觉样式
public/
  favicon.png        头像 + favicon
  images/
    blogs/           博客用图（按需新建）
    talks/           演讲用图
astro.config.mjs     site 域名与集成（mdx / sitemap / Shiki 代码高亮 / remarkMermaid 图表）
```

## Skills 安装

`skills/` 下含 `SKILL.md` 的目录会被 `scripts/install-skills.sh` 发现，并按目录名软链到 agent 技能目录（默认 `~/.cursor/skills` 与 `~/.claude/skills`）。

```bash
npm run install-skills              # 软链安装（跳过已存在）
npm run install-skills:force        # 覆盖同名链接（移动过 skill 目录后用它重指）
scripts/install-skills.sh --list    # 列出发现的 skill
scripts/install-skills.sh --dry-run # 预演，不改动
scripts/install-skills.sh --uninstall  # 移除指回本仓的链接
```

安装或改动 skill 后需**重载 Cursor / 重启 agent** 才生效。

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

- 列表（首页博客、Talks）按 `date` **倒序**（越新越靠前）。同一天有多篇时，用带时间的 ISO 形式区分先后，例如 `date: 2026-06-27T16:00:00+08:00`；页面只展示到「年-月-日」，时间仅用于排序。
- 正文是标准 Markdown，代码块自动高亮并跟随主题。
- `tags` **最多 3 个**，选最贴切的即可，不要为了覆盖搜索词而堆砌标签。已在 `src/content/config.ts` 的 zod schema 中用 `.max(3)` 硬校验，超过会导致 `npm run check` / `npm run build` 报错。

### 趣味性：emoji 与图表

为了让文章读起来更轻松、信息结构更直观，鼓励（但不滥用）以下两种手段。原则是**服务于理解，点到为止**，不要为了热闹而堆砌。

**Emoji**

- 给二级标题（`##`）前置一个贴合主题的 emoji，帮助读者扫读时快速定位，例如 `## 🧠 先分清两个词`、`## 📊 数据`、`## 🛠️ 写进流程`。同一篇里尽量每个标题一个、不重复、语义相关。
- 正文中偶尔用 emoji 点缀情绪或结论即可，避免每段都加；切忌出现在严肃数据/引用旁边喧宾夺主。
- 三级标题与列表默认不加，除非确有必要。

**图表（mermaid）**

用围栏代码块声明，语言标记为 `mermaid`，构建时会被 `astro.config.mjs` 里的 `remarkMermaid` 转成 `<pre class="mermaid">`，跳过 Shiki，由 `PostLayout.astro` 的客户端脚本渲染：

````md
```mermaid
flowchart TD
    A["🤖 AI 给出答案"] --> B{"我有没有独立判断?"}
    B -->|"有"| C["✅ 认知卸载"]
    B -->|"没有"| D["⚠️ 认知投降"]
```
````

约定与注意：

- 节点文案含中文、标点、`<br/>` 换行或 emoji 时，**用双引号包起来**（如 `A["文案"]`），避免 mermaid 解析报错。
- 优先用 `flowchart TD/LR`（流程/决策）与 `flowchart LR` 闭环（正循环），简单清晰即可；一篇文章 1~3 张为宜，别把表格能讲清的东西画成图。
- 图表会自动适配明暗主题（light → `neutral`，dark → `dark`），无需手动配色。
- **风格：手绘/漫画风**。`PostLayout.astro` 的 `mermaid.initialize` 已固定 `look: 'handDrawn'`（rough.js 草图线条）+ `handDrawnSeed: 1`（线条稳定不抖动），字体用 Comic Neue（西文，`@fontsource/comic-neue`）+ 霞鹜文楷（中文）。如需改回常规风格，把 `look` 去掉或设为 `'classic'` 即可。
- 语法错误不会阻断页面（脚本内 `try/catch`），但请本地 `npm run dev` 确认能正常出图。
- 同样适用于演讲（Talks）正文。

### 演讲（Talks）

在 `src/content/talks/` 新建 `.md`。frontmatter 同博客，外加可选 `subtitle`、`event`，
再加一个必选的 `template` 字段（`'scenes' | 'deck'`，缺省即 `'scenes'`），决定用哪种
幻灯片引擎渲染。两种模板分属路由 `slides-scenes` / `slides-deck`（各自只 import 一种引擎）；
公开入口仍是 `/talks/<slug>/slides`（308 到对应内部路径）。选哪个模板只影响
"内容怎么写、长什么样"，不影响链接分享入口、前进后退这些行为。

**怎么选模板：**

- `scenes`（默认，成本最低）——正文就是普通 Markdown，正文即幻灯片源，遵循两个分隔约定：
  - `---`（独占一行）分隔**每一页**（scene）
  - `+++`（独占一行）分隔**页内渐进显示步骤**（beat）

  支持 Markdown 的标题、列表、引用、代码块、图片，复用站点排版。适合"图文并茂的长文"类分享，
  由 `ScenesDeck.astro` 渲染。

- `deck`（结构更重，适合"真正拿去讲"的场合）——frontmatter 里写 `deck.slides`（每页一个带
  `type` 的对象，Zod 在 `src/content/config.ts` 里按 discriminated union 做 build-time 校验，
  写错字段会直接报错而不是浏览器里静默失败），可选 `deck.sections` 给顶部标签栏分组。渲染出
  "Notebook Tabs" 视觉风格（`NotebookTabsDeck.astro` + `src/styles/decks/notebook-tabs.css`），
  拿到卡片式翻页、图表、代码块等更丰富的版式。示例见 `src/content/talks/soft-orchestration-in-skills.md`：

  ```yaml
  template: deck
  deck:
    sections:
      - id: '1'
        label: 开场
    slides:
      - type: title
        section: '1'
        eyebrow: Conference Talk · Agent Skill 设计
        title: '标题，支持内联 <span class="accent">HTML</span>'
        lead: 副标题说明
      - type: diagram
        section: '1'
        kicker: '02'
        heading: 小标题
        mermaid: |
          flowchart LR
              A["节点"] --> B["节点"]
        bullets: [要点一, 要点二]
  ```

  当前支持的 `type`：`title` / `quote` / `split` / `code` / `grid` / `chain` / `branch` /
  `bullets` / `diagram`。渲染分发在 `src/components/decks/notebook-tabs/registry.ts` 的
  `SLIDE_RENDERERS` 里（新增 slide type 要三处联动：`config.ts` 加 schema、`notebook-tabs/`
  下新增对应的 `.astro` 组件、`registry.ts` 里注册）。各 slide 组件应优先复用
  `notebook-tabs/primitives/`（`Md` / `SlideHead` / `Bullets` / `RefLinks`）而不是各自手写
  `marked.parseInline`。

  `diagram` 类型直接内嵌一段 Mermaid 源码，走和博客文章完全一致的渲染管线（同一套
  `mermaid.initialize` 配置、字体、`handDrawnSeed`），**博客里已经画过的图表可以原样复制过来复用**，
  不用再用 `chain` / `branch` 之类的图元重新画一遍等价的示意图。

**Deck 相关代码位置：**

- `src/lib/deck/url-state.ts` —— `scene`/`beat` 与 URL query 的读写，两套模板共用。
- `src/styles/decks/chrome.css` —— 返回按钮、键盘提示这类"角落固定元素"的间距/层级/过渡变量
  （`--deck-corner-inset-*`、`--deck-corner-z`、`--deck-meta-transition`），两套模板都
  `@import`/引用它，保证视觉手感一致；具体配色仍由各自模板决定（`ScenesDeck` 明暗主题自适应，
  `NotebookTabsDeck` 固定纸张配色）。
- `src/components/decks/notebook-tabs/registry.ts` —— slide type → 渲染组件的映射表。
- `src/components/decks/notebook-tabs/primitives/` —— 各 slide 组件共享的小组件。

**导出离线单文件：**

```bash
npm run build:talk -- <slug>
```

会先跑站点构建，再把 `/talks/<slug>/slides-{scenes|deck}/` 打成 `dist-talk/<slug>.html`（可直接用浏览器打开；含 favicon 与署名「蘇里」）。站点专用 chrome 打 `data-export-strip`（返回链接、Analytics、主题切换），由导出接缝剥离。**字体走网络**：Google Fonts 保留 CDN；站点自托管 webfont 改写为 `https://yanguangjie.com/_astro/...`（需已部署对应构建）。图片与脚本仍内联。策略见 `scripts/lib/export-policy.mjs`。`dist-talk/` 已 gitignore。

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

- **类型门禁（必须遵守）**：项目必须通过所有 TypeScript / tslint 检查，**不得留有任何类型报错**。提交前请确保 `npm run check`（即 `astro check`）输出 `0 errors`；`npm run build` 已内置 `astro check`，类型不通过会直接构建失败。
  - 所有 `.astro` / `.ts` 文件及 `<script>` 内联脚本都在检查范围内；为隐式 `any` 的参数补类型、为可能为 `null` 的 DOM 查询做判空或断言。
  - `astro.config.mjs` 顶部的 `// @ts-check` 必须保留；其中的 remark/工具函数请用 JSDoc 标注类型（mdast 类型来自 `@types/mdast`）。
- 包管理走公共 npm registry（项目级 `.npmrc`），不要切回内网源。
- 不要把构建产物 `dist/` 或 `node_modules/` 提交（已在 `.gitignore`）。
- 改名 / 身份信息变更时，注意全站一致（页头、页脚、SEO、RSS、About）。
- 提交信息使用中文、语义化前缀（feat/fix/chore/content 等）。
- **响应式（必须遵守）**：UI 开发需保证在主流屏幕尺寸下都有较好体验，至少覆盖移动端、平板、PC 端；开发中请用浏览器自带的设备模拟或调整窗口宽度自查，不要只在一种尺寸下验收。
- 新增有价值的用户行为（点赞、分享、收藏等互动）时，先询问用户是否需要补充自定义事件上报；如需要，在 `src/lib/analytics.ts` 中按现有约定新增类型化事件，不要在组件里直接裸调用 `track()`。
- **`src/styles/global.css` 里不要写宽泛的元素选择器规则（`body`/`html`/`pre` 这类不带
  class 限定的规则）**：历史上 `slides.astro` 曾同时静态 import 两套 deck，CSS 会串味。
  现已拆成 `slides-scenes.astro` / `slides-deck.astro`（公开 `/slides/` 仅 308 跳转），
  串味风险大减，但 deck 全屏文档仍不要依赖「站点 global 标签选择器不会碰到我」——给 deck
  侧需要的元素写显式 reset 更稳。已经踩过的坑：
  - 给 `body` 加 `display:flex` 把 21 页 `.slide`（各 100vh）挤扁成每页 40px。
  - 通用的 `pre { border/padding/border-radius }`（本是给博客代码块用的）套在
    `DiagramSlide.astro` 的 `pre.mermaid` 上，和 `.diagram-wrap` 自己的点阵卡片边框叠成了
    两层框（`.deck-root pre.mermaid` 需要显式 `border:none；padding:0；border-radius:0`
    才能盖掉它）。
  真要给某个 layout 加结构性样式，写进该 layout 自己的 scoped `<style>`（例如 `BaseLayout.astro`
  里的 sticky footer 写法），Astro 的样式隔离只会作用于该组件自己渲染出的元素，不会跨组件泄漏；
  真要在 `global.css` 里写标签选择器，评估一下会不会波及 talks 的 deck 页面，必要时给 deck 侧的
  对应元素补显式 reset。
