# Hannah — 领域词表

架构用词（**模块**、**接口**、**接缝**、**适配器**、**深度**、**杠杆**、**局部性**）见 codebase-design skill；下列为本项目领域名词。

## Talks 与幻灯片

| 术语 | 含义 |
|------|------|
| **Talk** | `src/content/talks/` 下的一篇演讲内容（Markdown + frontmatter）。 |
| **template** | Talk frontmatter：`'scenes' \| 'deck'`，决定用哪套幻灯片引擎。 |
| **slides** | Talk 的全屏演示页。公开 URL：`/talks/<slug>/slides/`。 |
| **ScenesDeck** | 默认引擎：正文按 `---` / `+++` 切成 scene / beat。 |
| **NotebookTabsDeck** | 结构化引擎：`deck.slides[]` 按 `type` 分发，笔记本标签栏样式。 |
| **deck chrome** | 幻灯片角落固定 UI（返回、进度、键盘提示、署名等）。间距变量在 `src/styles/decks/chrome.css`。 |
| **站点专用 chrome** | 独立导出时不应出现的 chrome，打 `data-export-strip`：返回链接、Analytics、主题切换。 |
| **独立导出** | `npm run build:talk` 生成的单文件 HTML，落在 `dist-talk/<slug>.html`。 |
| **slides 导出接缝** | deck 模板与导出内联器之间的契约：剥离标记 + 导出策略（字体、署名、origin）。 |
| **导出策略** | 独立导出的共享配置模块：`assetOrigin`、署名文案、剥离属性名、字体 CDN/改写规则。 |
| **内部 slides 路径** | 构建期各管一种模板的路由：`/talks/<slug>/slides-scenes/`、`/talks/<slug>/slides-deck/`。公开 `/slides/` 经 **308 重定向** 指到对应路径（薄 `slides.astro`，不 import 任何 deck）。 |

## 明确延后

| 术语 | 说明 |
|------|------|
| **deck 运行时加深** | 把导航 / Mermaid 从 Astro 内联 `<script>` 抽到 `src/lib/deck/`（架构评审候选 3）；不在本轮 2→1 范围内。 |
