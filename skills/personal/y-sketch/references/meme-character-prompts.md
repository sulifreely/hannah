# 梗图角色 Prompt 关键词库

组装角色时的"配方表"。SKILL.md 里的角色库表格负责**选谁**（情绪 × 场景），这里负责**怎么写进 prompt**（英文关键词）。真正开始写 prompt 时再来查。

## 目录

- [先读：三条使用纪律](#先读三条使用纪律)
- [一、手绘抽象 / 欧美卡通梗（扁平简笔画）](#一手绘抽象--欧美卡通梗扁平简笔画)
- [二、动物顶流梗（照片 / 卡通）](#二动物顶流梗照片--卡通)
- [三、动漫 / 影视 / 国产抽象梗](#三动漫--影视--国产抽象梗)
- [通用负面词与落地方式](#通用负面词与落地方式)

## 先读：三条使用纪律

**1. 只收有幽默或讽刺张力的梗。** 入库标准是"一出来就有笑点或反讽"——自嘲、阴阳、夸张、反差、看穿。纯卖萌、纯煽情、纯中性的表情不用，它们撑不起 sketch-meme 的笑点。选角色时也用这条自问：这个梗好笑 / 好讽在哪？答不上来就换一个。

**2. 风格要统一，别串味。** y-sketch 的门面是「白底 + 手绘黑线稿 + 彩色填充」的 sketch-meme。下面有些角色原生是照片（柴犬、暴躁猫）或特定动画画风。同一张图**只用一种视觉语言**：

- 默认做法：把选中的角色**翻译进手绘 sketch 风**（照片 / 动画关键词换成 `simple black line art, flat color, hand-drawn meme` 那套），保持整篇系列一致。
- 例外：当某个梗**离开原生形态就不成立**时，才整张用它的原生风格，且这一张不再混手绘角色。

**3. 关键词是零件，不是整句 prompt。** 把下面的正向关键词插进 SKILL.md 的「Prompt 公式」对应位置（场景 / 角色段），再补场景、标签、色彩、风格收尾。不要直接把一行关键词当成整条 prompt 交出去。

---

## 一、手绘抽象 / 欧美卡通梗（扁平简笔画）

> 这一类天生就是手绘线稿，最贴 y-sketch 默认风格，可放心与 Wojak 同框。

- **Wojak / Feels Guy**：`Wojak, Feels Guy, bald lonely man, simple black line art, white background, 2D meme drawing`；衍生 `Doomer`（悲观废人）、`Soyjak`（自卑宅男，张嘴惊叹脸）
- **哲学迅猛龙 Philosoraptor**：`Philosoraptor, green raptor dinosaur, hand on chin, thinking pose, simple cartoon` — 灵魂拷问、玄学反问
- **飞出个未来挑眉 Fry**：`Futurama Fry meme, narrow suspicious eyes, blue cartoon character` — "分不清是 A 还是 B"、看穿真相
- **巨魔脸 Trollface**：`Trollface, white grinning face, black outline, old internet meme, flat drawing` — 恶作剧得逞、故意使坏
- **绝望四格 Okay Guy**：`Okay Guy four panel meme, gradually dejected expression, simple line art` — 逐格认命、"行吧就这样"

## 二、动物顶流梗（照片 / 卡通）

- **Doge 神烦柴犬 Kabosu**：`Doge meme, Kabosu the shiba inu, wise squint eyes, soft real photo, warm lighting` — 阴阳调侃、such bug very 技术债
- **Cheems 流泪柴犬**：`Cheems meme, slumped shiba inu, teary eyes, sad expression, indoor photo` — 破防、温柔安慰、"谢谢你"
- **暴躁猫 Grumpy Cat**：`Grumpy Cat, flat frown unimpressed face, white cat, close-up portrait` — 嫌弃、无语、一切都没劲
- **悲伤蛙 Pepe**：`Pepe the Frog, green frog, depressed slouched posture, simple cartoon meme sticker` — emo、深夜破防（有喜怒哀乐各版本）
- **科米特青蛙 Kermit**：`Kermit the Frog, subtle sarcastic smile, green puppet frog, plain background` — 表面和善背地阴阳；Evil Kermit 内心怂恿
- **背手负鼠**：`meme opossum, hands behind back, blank numb expression, simple background` — 社畜麻木、精神放空

## 三、动漫 / 影视 / 国产抽象梗

**欧美动画**

- **章鱼哥 Squidward**：`Squidward Tentacles, exhausted deadpan eyes, SpongeBob cartoon style` — 疲惫社畜、深度内耗
- **原始海绵宝宝 SpongeGar**：`SpongeGar primitive sponge, panicked shocked face, SpongeBob cartoon style` — 慌张、突发惊吓
- **派大星 Patrick**：`Patrick Star, blank dumb face, confused, SpongeBob cartoon style` — 脑子宕机、单纯迷惑
- **瑞克 Rick Sanchez**：`Rick Sanchez, half-lidded disdain eyes, Rick and Morty art style` — 天才式不屑、"你们这也叫问题？"

**二次元 / 游戏**

- **德丽莎智慧眼神**：`Theresa Apocalypse, sly squint eyes, Honkai Impact 3 art style, meme face` — 看穿一切的坏笑
- **原神胡桃**：`Hu Tao, mischievous smirk, Genshin Impact illustration, funny meme expression` — 调皮使坏、"嘿嘿"

**国内抽象梗**

- **神鹰黑手哥**：`abstract close-up portrait, exaggerated facial expression, short video screenshot style` — 夸张抽象、"就这？"

> 二次元 / 影视 / 国产梗风格差异大，跨系列拼贴很容易脏。技术博客里优先前两类（Wojak 手绘 + 动物梗），这一类当彩蛋点缀，一张图别超过一个。

## 通用负面词与落地方式

统一的"避坑词"：

```
ugly, deformed, blurry, extra limbs, missing limbs, floating limbs, extra fingers, missing fingers, fused fingers, distorted face, mismatched eyes, messy background, text, watermark, signature, multiple characters overlapping, broken proportions, inconsistent perspective, multiple vanishing points, mismatched shadow direction, object clipping through another object
```

按图像后端处理方式不同：

- **支持负面 prompt 的后端**（Stable Diffusion / ComfyUI / Midjourney 的 `--no` 等）：直接填进 negative prompt 字段。
- **没有负面字段的后端**（如 Cursor `GenerateImage`）：在正向描述末尾写一句 `Avoid: ...`，把上面的词翻译进去，例如 `Avoid: deformed hands, extra/missing fingers, extra/missing/floating limbs, distorted faces, unintentional asymmetric eyes, messy cluttered background, unwanted text/watermark, overlapping characters, broken proportions, inconsistent perspective or shadow direction`。
- 注意 `text, watermark` 是防**多余乱码文字**；如果这张图**本来就要**中文短标签或 "APPROVE" 之类的 meme 文字，别把有意的标签也一起 avoid 掉——只压制随机水印和乱字。
- 同理，`mismatched eyes` 是防**意外的表情崩坏**（两眼大小/位置对不上、看起来像画错了）；如果角色本来就要用 Smug Wojak 那种"一只眼眯起"的**刻意**不对称表情，别把这个有意的表情也一起 avoid 掉——只压制无意的脸部崩坏，且要在正向 prompt 里把这个不对称表情写清楚（见 SKILL.md Anatomy 段），让模型知道这是设计好的。
- 手指数量、肢体缺失、透视消失点、光影方向这几项和 SKILL.md「Prompt 公式」里的 Anatomy / Perspective & light 正向段是同一件事的一体两面：正向段说清楚"要什么"，这里的避坑词兜底"不要什么"。多角色、多物体同框（对比式、四宫格）时两边都要用上，单靠一边压不住穿帮。
