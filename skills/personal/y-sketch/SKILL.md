---
name: y-sketch
description: 为任意文章（博客、笔记、文档、公众号、分享稿）生成 sketch-meme 风格封面图和正文插图——手绘黑线稿 + 彩色填充 + 按情景挑选的网络梗图角色（Wojak / 柴犬 / 悲伤蛙 / 海绵宝宝等）。当用户提到封面图、文章插图、meme 风格配图，或写作流程需要产出封面时调用。
---

# Y Sketch

## 核心定位

y-sketch 把任意一篇文章的核心矛盾，翻译成一张 sketch-meme 图。它不挑题材、不挑平台，博客、笔记、文档、公众号、分享稿都能服务，也不绑定某个仓库的目录结构。

**sketch-meme**：白底 + 手绘黑线稿 + 彩色块填充 + 按情景挑的网络梗图角色 + 幽默构图 + 短标签文字。一句话：那种懂梗的博主会在 Twitter 发的彩色手绘表情包。

它不写文章，不画技术图示（交给 y-diagrams）。只做一件事：把文章最值得笑的那个矛盾画出来。

**复杂度红线**：一张图只讲一个矛盾。主角色 ≤ 3 个，标签 ≤ 5 条，构图元素能删就删。宁可留白，也不要把梗、角色、箭头、气泡全堆上去——杂乱的 meme 既不好笑也读不懂。

## 工作流程

### 1. 找灵魂梗

从文章（或用户描述）里找出最适合 sketch-meme 的核心矛盾：

- 什么 vs 什么？
- 谁在做蠢事，谁在做对的事？
- 什么情况让人哭，什么情况让人笑？
- 有没有一个反讽性的自我打脸？

### 2. 选构图

从「构图库」选一种，记录要用的场景布局。

### 3. 选角色

**从整个梗图角色库里，按情景挑最贴切的那个角色**，不预设某一家。先问："这个情绪 / 这个矛盾，哪个梗一出来大家就懂、且自带笑点或反讽？"——是认命就用 Okay Guy，是社畜内耗就用章鱼哥，是阴阳吐槽就用 Doge，是无脑执行才用 NPC Wojak。谁最精准用谁，**主角 ≤ 3 个**。

选完守两条纪律：

- **只用有梗的角色**：每个角色都要带幽默或讽刺张力（自嘲、阴阳、夸张、反差、看穿）。纯卖萌、纯煽情、纯中性的形象撑不起 sketch-meme，答不出"它好笑/好讽在哪"就换一个。
- **风格别串味**：同一张图统一一种视觉语言（都手绘，或都某种原生画风），别把手绘角色和照片风 / 动画风角色混在一张里。具体见 `references/meme-character-prompts.md` 的使用纪律。
- **角色服务矛盾**：宁可一个精准的梗，也不要凑三四个"看起来热闹"的角色。

### 4. 组装 prompt

按「Prompt 公式」逐段组装。必须包含：风格声明 + 场景描述 + 标签文字 + 色彩说明 + 风格收尾。组装时同步做减法：删掉不影响主矛盾的元素，标签控制在 5 条以内。

需要某个角色的具体英文关键词、或想确认它该用手绘还是原生画风时，读 `references/meme-character-prompts.md`——那里有分类配方表和通用负面词的落地方式。

### 5. 生成并落盘

调用运行时自带的图像生成工具（Cursor 用 `GenerateImage`，比例写进 description 文本）生成图片，然后**跟随目标项目的既有约定**落盘，不要假设固定路径：

1. **先探测**：看同目录或相邻文章怎么放图、怎么引用——有没有静态资源目录（`public/`、`static/`、`assets/`）、frontmatter 有没有 `cover`/`image` 字段、已有图用的是相对路径还是站点绝对路径。
2. **跟随约定**：静态站点（Astro/Hugo/Next 等）通常图放进 `public/`、`static/`，用站点绝对路径引用；普通 Markdown/笔记通常放在文章同级子目录，用相对路径引用。
3. **探测不到就用默认**：在文章同目录建 `<slug>/` 子目录，图片存为 `NN-cover-<slug>.png` / `NN-<slug>.png`，正文用相对路径引用。
4. **封面**写进 frontmatter 对应字段（`cover`/`image` 等）；**正文插图**插入对应段落的 Markdown 图片引用。

完成标准：图片文件已存在，Markdown 引用路径已写入（封面已进 frontmatter）。

## 构图库

### 对比式（Left vs Right）

适用：两种路径、两种结果的直接对比。

布局：
- 左侧：混乱 / 错误路径 + 负面角色
- 中间：大号 **VS** 或闪电分隔线
- 右侧：有序 / 正确路径 + 正面角色
- 底部（可选）：一行公式或口号

### 钟形曲线（Bell Curve / IQ Meme）

适用：两个极端选了相同简单方案，中间大多数选了复杂方案——反讽"聪明反被聪明误"。

布局：
- 左（低分）：Plain Wojak + 简单观点标签
- 曲线顶部（中分）：Crying Wojak + 复杂方案 bullet list
- 右（高分）：Chad 或 Hoodie NPC + 和左侧完全相同的简单观点

### 单场景式（Single Scene）

适用：一个角色在遭遇某种情况，场景元素全部加标签。

布局：
- 一个主角色（表情明显）
- 场景里 2–3 个元素各有短标签（元素越少越好，能删就删）
- 可加 1 个对话气泡

### 序列式（Before → After）

适用：展示一个转变过程。

布局：
- 左：Before 状态（通常负面）
- 大箭头 →（箭头上方可写触发条件）
- 右：After 状态（通常正面）

### 四宫格漫画（2×2 Comic）

适用：文章里有一个**小故事或反转**——事情一步步发展，到最后一格才抖出包袱。比"对比式"多了时间线，特别适合"以为很顺 → 中途出岔 → 硬撑 → 翻车/真相"这类叙事。

布局：
- 2×2 四格，从左上顺时针（或从左到右、从上到下）阅读，格子之间留清晰白色描边分隔。
- 每格是一个**极简单一场景**：一个角色 + 一个动作/表情 + 最多一条短标签。四格加起来仍守复杂度红线，别把每格都塞满。
- 前三格铺垫，第四格是反转/punchline，情绪落差要明显（如前松后紧、前得意后破防）。
- 四格可以让同一个角色的表情逐格变化（如 Plain → Smug → 疑惑 → Crying），比换四个角色更连贯。

**复杂度提醒**：四宫格容易越画越满。宁可每格只画一个头、一句话，也不要在小格子里堆道具和背景。生成时在 prompt 里写明 "4-panel comic, 2x2 grid, clean white gutters, each panel minimal with one character and one short caption"。

## 梗图角色库

**不预设某一家角色，按情景挑最贴切的。** 先明确要传达的情绪或矛盾，再从下表里找那个"一出来大家就懂"的梗。Wojak 家族表情谱系全、最百搭，常常是顺手的选择，但不是默认答案——认命、社畜内耗、阴阳吐槽、灵魂拷问这些情绪，用对应的专属梗往往比 Wojak 更精准、更好笑。

选角色的三条纪律：一是**每个角色都要有幽默或讽刺张力**（纯卖萌 / 纯煽情 / 纯中性的形象不入库、也不该选）；二是**同一张图别混搭太多风格**（一种视觉语言到底，别把手绘角色和照片风 / 动画风角色混在一起）；三是**角色服务于矛盾**，不是"多放几个梗更热闹"。

下表给的是"选谁"（情绪 × 场景）；每个角色具体的英文关键词配方、原生画风与手绘化处理、以及更多真人 / 动画 / 国产抽象梗，见 `references/meme-character-prompts.md`。

### Wojak 家族（百搭、表情谱系最全）

| 角色 | 情绪 | 典型使用场景 |
|---|---|---|
| **Plain Wojak**（简单脸） | 普通、无辜 | 普通参与者；"我以为我懂了"的状态；流程里的中性角色 |
| **Crying Wojak**（哭泣大脸） | 痛苦、崩溃 | 理解债、线上事故、技术债累积 |
| **NPC Wojak**（木头空白脸） | 无意识、机械执行 | 认知投降；无脑 approve；复制粘贴 AI 输出 |
| **Chad Wojak**（大下巴自信脸） | 自信、正确 | 做了正确判断；有 calibration 的工程师 |
| **Smug Wojak**（得意小眼） | 自以为是 | galaxy-brain 反例；过度工程化 |

### 更多角色（情绪对得上就优先用）

| 角色 | 情绪 | 典型使用场景 |
|---|---|---|
| **悲伤蛙 Pepe**（绿色青蛙） | emo、失落、深夜破防 | "feels bad"；发现 AI 一本正经撒谎；孤独 debug（有喜怒哀乐各版本） |
| **开心蛙 Pepe**（竖拇指） | 满足、成功 | 验证通过；正向循环跑通 |
| **Kermit（科米特青蛙）** | 表面和善、背地阴阳 | 嘴上说"都行"，心里疯狂吐槽；Evil Kermit 内心小人怂恿 |
| **Okay Guy（认命脸）** | 摆烂、认命、无力反抗 | "行吧，就这样吧"；明知有坑还是硬着头皮上线 |
| **Philosoraptor（哲学迅猛龙）** | 灵魂拷问、玄学思考 | 抛一个直击本质的反问；"如果测试没人看，它还算测试吗" |
| **Futurama Fry（眯眼 Fry）** | 看穿真相、恍然大悟 | "分不清是需求变了还是我理解错了"；识破漂亮结论下的坑 |
| **Doge（神烦狗）** | 阴阳调侃、碎碎念、狗头保命 | wow、such bug、very 技术债；自嘲式吐槽 |
| **Cheems（流泪柴犬）** | 破防、伤感、温柔安慰 | "谢谢你，代码"；被线上告警锤到瘫坐；软软的自我安慰 |
| **Grumpy Cat（暴躁猫）** | 嫌弃、无语、一切都没劲 | 看到又一个"临时方案"；对过度设计翻白眼 |
| **背手负鼠（发呆负鼠）** | 社畜麻木、精神放空 | 被迫接需求；会开到一半灵魂出窍；机械上班 |
| **质问猫 + 委屈咣当猫** | 领导训人 vs 挨骂委屈 | 一大一小：上游甩锅 / 被 review 追问 / 训斥与辩解组合 |
| **章鱼哥 Squidward** | 疲惫、社畜、厌烦、内耗 | 又是加班；对重复劳动深度厌倦 |
| **SpongeGar（原始海绵宝宝）** | 慌张、崩溃、突发惊吓 | 线上突然报警；看到 diff 里的惊天改动 |
| **派大星（傻呆脸）** | 脑子宕机、单纯迷惑 | 完全没听懂需求；对着报错一脸空白 |
| **"This is Fine" Dog（着火的狗）** | 灾难中假装平静 | 技术债；混乱系统里假装一切 OK |

## Prompt 公式

```
Hand-drawn meme-style illustration, white background, colorful sketchy internet meme style humor.

{场景：描述角色位置、动作、表情、相互关系}
{标签：描述图中的文字标注内容和位置}

{色彩：负面 / 混乱一侧用红 / 橙 / 灰色调；正面 / 有序一侧用蓝 / 绿色调；背景白色；线稿黑色；强调标签用黄色或粗黑体}

Anatomy: correct cartoon body proportions, each hand clearly drawn with five fingers, no extra or missing limbs, natural joint bending direction, symmetrical facial features unless the expression itself deliberately calls for asymmetry (e.g. one-eye smug squint) — if using an asymmetric expression, state it explicitly in the scene description so it reads as intentional, not a drawing error.

Perspective & light: every character and object in the same panel shares one consistent eye-level and vanishing point, clear foreground/midground/background separation, no object overlapping or clipping through another, objects scale down correctly with distance, one consistent light direction with matching flat shadow shapes — keep shading flat and graphic, not photorealistic volumetric rendering. If the scene implies a direction of travel or attention (walking toward a goal, looking at something, moving along a path), the character's body orientation, gaze, and stride must point toward that same direction, not away from it or sideways to it.

Art style: Bold black sketch outlines, bright color fills, slightly wobbly imperfect lines, humorous exaggerated expressions, meme energy. Clean uncluttered composition with generous whitespace, only a few key elements, no background clutter. Image ratio 16:9, landscape format for blog cover.
```

**标签原则**：每条标签 5 字以内，全图 ≤ 5 条。长解释放封面文字下方或文章正文，不写在图里。图里可以同时出现中文标签和英文 meme 惯用语（如 "APPROVE →"、"This is Fine"）。

**减法原则**：prompt 里主动写明 "clean, uncluttered, minimal elements, lots of whitespace"，避免模型自行往画面里塞满道具、背景和小图标。

**解剖与透视段是硬约束，不是可选装饰**：手绘 meme 风格允许夸张变形（大头小身子、超长手臂强调动作），但"夸张"和"画崩"是两件事——夸张是刻意为之、逐格/逐图保持一致的风格化处理；画崩是手指数量随机、肢体凭空多一只、视平线和消失点各画各的、光源和阴影方向随手乱画。上面两段的目的是压住后者，不是禁止前者。多角色、多物体同框（尤其是四宫格、对比式构图）时最容易出问题，组装 prompt 时要显式检查这两段是否覆盖了当前构图里的所有角色和物体。

**角色朝向要服务于场景的方向性叙事，不能套用默认行走姿势模板**：模型很容易不管背景往哪延伸，习惯性画一个正面偏左侧的"走路贴纸"——如果场景本身有方向性（沿一条路径/轨道走向某个目标、盯着某个东西看、朝某个方向移动），角色的身体朝向、视线、迈步方向要跟这个方向大致一致，不能背对目标走、也不能和路径方向岔开甚至垂直。组装 prompt 前先想清楚：场景里的消失点/目标物（终点旗、路的尽头、屏幕、箭头指向）在画面哪一侧，再把角色的头、身体、脚步都往那一侧偏，在 prompt 里直接写清楚朝向（如 "facing/walking toward the upper-right, toward the flag/goal"），不要只写"角色在走路"这种不含方向的描述。

## 屏幕朝向（透视一致性的专项情况）

「Prompt 公式」里的透视与光影段管的是全局一致性；屏幕类元素是最容易穿帮的专项情况，单独展开。

只要画面里出现**屏幕类元素**（显示器、笔记本、手机、平板、记事本、纸张），就要交代清楚朝向和透视，否则模型很容易画出"人从背后看屏幕，却又能看到正面内容"这种穿帮镜头。

规则：

- **先想清楚镜头站在哪**：镜头在角色身后 → 只画显示器**背面**，看不到屏幕内容；镜头在角色正/侧面 → 屏幕正面朝向角色，观众看到的是侧面或斜后方，别让屏幕正对镜头又正对角色。
- **一块屏幕只有一个正面**：屏幕内容和角色视线必须指向同一侧，不能既朝角色又朝镜头。
- **透视一致**：桌面、屏幕、键盘、人物要共用同一套视角与地平线，避免元素各画各的。

角色从背后看屏幕、只需暗示"他在盯着屏幕"时，在 prompt 里加这组关键词：

```
back view of monitor, screen facing away from camera, screen towards the character, character facing the screen, only the back of the screen visible, cannot see screen display, side/behind shot, depth of field, correct perspective, no reversed screen
```

如果确实要露出屏幕内容（比如展示一段代码/一个 APPROVE 按钮），就把镜头放在角色侧后方或让屏幕侧转，让"屏幕正面 + 角色侧脸"同时成立，而不是硬把屏幕翻正对着镜头。

## 自检

- 不看文章也能猜到主题吗？
- 幽默感来自矛盾本身，不只是"加了个蛙"？
- 画面是否克制？主角 ≤ 3 个、标签 ≤ 5 条、没有多余道具和背景堆砌？（四宫格：每格是否也只有一个角色一句话？）
- 标签足够短，没有变成说明书？
- 角色是不是按情景挑的最贴切那个（而不是习惯性用 Wojak）？有没有多风格混堆？
- 每个角色都自带笑点或讽刺吗？有没有纯卖萌 / 纯中性、只是凑数的形象？
- 手/肢体正常吗？每只手五指、没有多余或缺失的肢体、关节弯曲方向自然？（区分"夸张风格化"和"画崩"，前者保留，后者要修）
- 多角色/多物体同框时透视和光影统一吗？同一视平线、同一消失点、近大远小、没有穿模重叠、阴影方向一致？
- 场景有方向性（走向目标、看向某处、沿路径移动）时，角色的头、身体、脚步朝向是不是也指向同一个方向，而不是背对目标、或和路径岔开/垂直？
- 有屏幕/记事本等元素时，朝向和透视是否合理？没有"背面却露正面内容"的穿帮？
- 封面图已按项目约定落盘，并写入 frontmatter 对应字段？
