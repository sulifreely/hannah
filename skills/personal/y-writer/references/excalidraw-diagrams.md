# Excalidraw 图示流程

仅当文章确实需要产出白板手绘风格图示时，才读取并执行本流程。

## Table of Contents

- [适用场景](#适用场景)
- [调用前检查](#调用前检查)
- [生成流程](#生成流程)
- [资产落盘](#资产落盘)
- [退回 Mermaid](#退回-mermaid)

## 适用场景

优先选择 Excalidraw 的场景：

- 直觉模型、概念关系、旧流程 vs 新流程。
- 8 个节点以内的主流程、状态变化、模块关系。
- 面向博客阅读、技术分享、白板讲解。

优先退回 Mermaid 的场景：

- 精确时序、复杂分支、可审阅源码图。
- 用户明确要求 Mermaid 源码。
- 用户明确不安装 Excalidraw 且需要图。

不要让 agent 自己手搓 SVG/HTML 图。所有“白板手绘”气质的图都走 Excalidraw skill；它跑不了，就退到 Mermaid。

## 调用前检查

需要画图时，第一步确认 `excalidraw-diagram-skill` 是否可用。常见安装位置：

- `.claude/skills/excalidraw-diagram/SKILL.md`
- `.cursor/skills/excalidraw-diagram/SKILL.md`
- 项目根目录下的 `.claude/skills/excalidraw-diagram/SKILL.md`

如果任何一个位置存在该 skill：读取它的 `SKILL.md` 并按它的工作流执行，把产物落到文章目录的 `assets/`。

如果都不存在，不要自己手画 SVG。直接给用户输出安装提示，让用户决定是安装 Excalidraw 还是退回 Mermaid。推荐文案：

> 我准备给这张图用 Excalidraw 画，但当前环境里没找到 `excalidraw-diagram-skill`。建议先安装一下：
>
> ```bash
> git clone https://github.com/coleam00/excalidraw-diagram-skill.git
> cp -r excalidraw-diagram-skill .claude/skills/excalidraw-diagram
>
> cd .claude/skills/excalidraw-diagram/references
> uv sync
> uv run playwright install chromium
> ```
>
> 装好后我会重新调用它来画图。如果这次不想装，我可以直接用 Mermaid 顶上。

只有用户明确说“先不装 / 用 Mermaid 顶一下”，才退到 Mermaid；否则等用户处理完安装再继续，不要硬画 SVG。

## 生成流程

调用 Excalidraw skill 时：

1. 先说明这张图要解决的理解问题。
2. 按 Excalidraw skill 的流程做概念映射、布局、JSON 生成、渲染和视觉校验。
3. 一张图只讲一个主问题。简单图通常不超过 8 个节点、12 条连线，复杂图先拆成多张小图。
4. 让 Excalidraw skill 自带的视觉校验跑完一轮，确认没有文本错位、箭头乱穿、节点重叠。
5. 图前先用一句话说“为什么需要这张图”，图后再解释“从图里能看到什么”，避免图沦为装饰。

## 资产落盘

当任务会写入本地文章、博客或文档目录时，遵循“正文干净，资产独立”的原则：

1. 为每篇文章建立或复用 `assets/` 目录，只放 Excalidraw 产物。
2. 资产文件使用语义化短横线命名，例如 `worktree-agent-model.excalidraw`、`old-vs-new-flow.png`。
3. Excalidraw 默认成对落盘：保留 `.excalidraw` 方便后续编辑，渲染好的 `.png` 供正文引用。
4. Markdown 正文只保留图片引用、图名前后的解释和必要图注；不要在正文里贴 `.excalidraw` 的 JSON 源码，也不要内联 SVG/HTML。
5. Mermaid 图直接写在正文代码块里，不进 `assets/`。
6. 如果一张图只是临时草图，不确定是否要落盘，先写一段图片占位说明，不要把半成品塞进最终正文。

## 退回 Mermaid

退回 Mermaid 时：

- 直接在 Markdown 正文里使用 Mermaid 代码块，不落 `.mmd` 文件。
- 在图前用一句话说明为什么换 Mermaid，例如“这里分支和时序比较精确，用 Mermaid 比手绘草图更不容易产生歧义”。
- 节点和边的标签保持短，超过一行的解释放到图后正文，不要塞进图里。
