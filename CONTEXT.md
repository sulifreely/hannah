# Hannah — 领域词表

架构用词（**模块**、**接口**、**接缝**、**适配器**、**深度**、**杠杆**、**局部性**）见 codebase-design skill。下列为本仓库领域名词；操作约定见 `AGENT.md`。

## Talks 与幻灯片

| 术语 | 含义 |
|------|------|
| **Talk** | `src/content/talks/` 下的一篇演讲（Markdown + frontmatter）。 |
| **template** | Talk frontmatter：`'scenes' \| 'deck'`（缺省 `scenes`），决定引擎与路由。 |
| **slides-scenes** | `template ≠ deck` 的全屏页：`/talks/<slug>/slides-scenes/`，引擎 **ScenesDeck**。 |
| **slides-deck** | `template: deck` 的全屏页：`/talks/<slug>/slides-deck/`，引擎 **NotebookTabsDeck**。 |
| **ScenesDeck** | 默认引擎：正文按独占行 `---` / `+++` 切成 scene / beat。 |
| **NotebookTabsDeck** | 结构化引擎：`deck.slides[]` 按 `type` 分发，Notebook Tabs 视觉。 |
| **scene / beat** | URL 深链单位：`?scene=N&beat=M`（两套引擎共用 `src/lib/deck/url-state.ts`）。 |
| **deck chrome** | 幻灯片角落固定 UI（返回、进度、键盘提示、署名等）；共用变量在 `src/styles/decks/chrome.css`。 |
| **站点专用 chrome** | 仅线上站点需要、独立导出应去掉的 UI：返回链接、Analytics、主题切换。模板侧打 `data-export-strip`。 |
| **独立导出** | `npm run build:talk -- <slug>` → `dist-talk/<slug>.html`（可单独打开的单文件）。 |
| **导出策略** | `scripts/lib/export-policy.mjs`：署名、`ASSET_ORIGIN`、剥离属性名、Analytics 脚本标记等。 |
| **导出接缝** | 模板只负责打 `data-export-strip`；内联器（`scripts/lib/inline-talk-html.mjs`）只消费该标记 + 导出策略，不硬编码 class 名。 |

## 明确延后

| 项 | 说明 |
|----|------|
| **deck 运行时加深** | 把导航 / Mermaid 从 Astro 内联 `<script>` 抽到 `src/lib/deck/`，尚未做。 |
