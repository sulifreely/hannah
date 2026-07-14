# Design: 将 Talk 幻灯片构建为离线单 HTML

**日期：** 2026-07-14  
**状态：** 已定稿，待实现

## 目标

新增 npm 命令，按 slug 把某一篇 talk 的 slides 打成**单个 HTML 文件**，可在浏览器直接打开；**字体依赖网络**（Google Fonts CDN + 站点上的 webfont）。JS/图片仍内联。便于分享。

## 非目标

- 不改变线上 `/talks/<slug>/slides/` 的观感与行为（除打包脚本对产物的后处理外，不改 deck 组件默认 UI）
- 不提供「一次打包全部 talks」的模式（可后续加）
- 不引入第二套 slides 渲染管线

## 用法

```bash
npm run build:talk -- <slug>
# 例：npm run build:talk -- agent-hitl-vs-yolo
```

产物：`dist-talk/<slug>.html`（目录加入 `.gitignore`，不提交）。

## 方案

**采用方案 A：先 `astro build`，再内联 slides 产物。**

1. 执行站点构建，得到 `dist/talks/<slug>/slides/index.html` 及 `_astro/` 等静态资源。
2. Node 脚本读取该 HTML，将依赖资源内联为可离线打开的单文件。
3. 写入 `dist-talk/<slug>.html`。

备选方案（未采用）：独立 Vite 入口 / Playwright 另存为——维护成本高或行为不可控。

## 内联与清洗规则

脚本对 slides HTML 做如下处理：

| 资源 | 处理 |
|------|------|
| 相对/绝对路径的 CSS、JS（含 `_astro/`） | 读入并内联到 `<style>` / `<script>` |
| `/images/...` 等本地非字体静态资源 | 转为 data URL |
| Google Fonts `<link>` / preconnect | **保留 CDN**，不下载、不内联（体积优化；打开时需联网） |
| 本地 webfont（`/_astro/*.woff2` 等） | 改写为 `https://yanguangjie.com/...` 绝对地址，不内联 |
| `public/favicon.png` | 转为 data URL，写入 `<link rel="icon">`（及可选 `apple-touch-icon`） |
| Vercel Analytics 等仅线上脚本 | 移除 |
| 「返回 talks / 返回详情」链接（如 `.hud-back`、`.deck-back-link`） | **删除 DOM**，保证分享界面纯净 |
| 创作署名 | **注入**角落固定文案：`蘇里`（不含网站名） |

署名样式贴近现有 deck chrome（角落 inset、低对比），不遮挡翻页与进度；scenes / deck 两种模板在打包时统一注入。

## 错误处理

- 未传 slug：打印用法，非 0 退出
- talk 不存在或为 draft / 构建后无对应 slides：明确报错
- 任一必需资源内联失败：打印具体路径/URL，不写出半残文件

## 验收标准

1. `npm run build:talk -- agent-hitl-vs-yolo` 生成 `dist-talk/agent-hitl-vs-yolo.html`
2. 浏览器直接打开该文件：翻页与既有交互可用；字体可走网络加载
3. 标签页显示 favicon；角落可见署名「蘇里」
4. 无「返回 talks」类链接；Google Fonts 仍为 CDN `<link>`，HTML 中无大规模字体 data URL
5. `dist-talk/` 已被 gitignore

## 涉及文件（预期）

- `package.json` — 增加 `build:talk` script
- `scripts/build-talk.mjs`（或同级）— 内联与清洗逻辑
- `.gitignore` — 增加 `dist-talk/`
- 不修改线上 slides 页面源码（署名与去链仅在打包后处理）
