---
title: Agent 中 Skill 的执行拓扑
subtitle: 六种编排模式在 Skill 侧的可靠性与边界
event: Agent 工程分享 / 2026
date: 2026-07-07
description: 聊聊如何把链式、并行、路由、循环、编排和层级这些执行拓扑写进 Skill。六种模式在 Skill 侧的可靠性并不均匀——Chain、Route、Loop 日常够用，Orchestrate 和 Hierarchy 是边界，越过这条线才值得引入 LangGraph 这类重型编排框架。
cover: /images/talks/execution-topology-reliability.png
tags:
  - Agent
  - Skill
  - 工程实践
template: deck
deck:
  sections:
    - id: '1'
      label: 开场
    - id: '2'
      label: 六种模式
    - id: '3'
      label: 落地实现
    - id: '4'
      label: 保障确定性
    - id: '5'
      label: 收尾
  slides:
    - type: title
      section: '1'
      eyebrow: Conference Talk · Agent Skill 设计
      title: 'Agent 中 Skill 的<span class="accent">执行拓扑</span>'
      lead: '六种 Agent 编排模式如何在 Skill 中表示、运行与收口，以及它们各自的可靠性边界'
      cover: /images/talks/execution-topology-reliability.png
      coverAlt: 左边角色沿单一箭头稳步前进（日常够用），右边角色被多路 worker 的箭头淹没、抓着电话找 LangGraph 求救（规模变大）

    - type: quote
      section: '1'
      eyebrow: 一个自然而然的问题
      quote: Agent 执行拓扑已经有成熟的设计模式归纳。那我们想想，如果不上类似 LangGraph 这类重型 workflow 框架，靠 Skill 自己能不能把这些模式跑起来？
      lead: 今天想带大家一起探索、验证一下，在 Skill 中六种模式分别该怎么实现以及可靠性如何。

    - type: split
      section: '1'
      kicker: '01'
      heading: 两种编排，两种重量
      columns:
        - label: 重型编排 —— 确定性，像「函数」
          dot: var(--text-faint)
          items:
            - 状态机 / DAG / workflow engine
            - 结构化输入，只关注最终结果、单次无状态
            - 把每一步写死成代码节点，流程由开发者预设
        - label: 轻型编排 —— 自主性，像「对话」
          dot: var(--tab-warn)
          items:
            - 写进 Skill 的操作流程，由 LLM 临场决策
            - 顺序、分叉、检查点、退出条件
            - 用自然语言把行动边界写清楚

    - type: quote
      section: '1'
      quote: 一个复杂任务，应该按什么顺序、以什么边界、由谁来完成？
      lead: 编排回答的就是这一个问题。任务简单的时候自然用不着；任务一旦复杂起来，自然而然就有了编排的需求。

    - type: diagram
      section: '1'
      kicker: '02'
      heading: 今天想分享三个内容
      mermaid: |
        flowchart LR
            classDef input fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef skill fill:#c14a3a,stroke:#9c3628,color:#fff
            A["指令 —— 怎么做"]:::input --> S(["Skill"]):::skill
            B["编排模式 —— 按什么拓扑走"]:::input --> S
            C["工具协议 —— 靠什么动手"]:::input --> S
            D["验证门禁 —— 凭什么收口"]:::input --> S
      bullets:
        - 1. Agent 执行拓扑的六类基础设计模式：链式、并行、路由、循环、编排、层级
        - 2. 这些模式分别在 Skill 里怎么表示，以及具体示例
        - 3. 在 LLM 这种概率模型作为执行者时，如何尽量保障结果确定

    - type: split
      section: '2'
      kicker: 先认识它们 —— 用前端开发中的例子来类比
      heading: 六种模式，你其实每天都在遇到
      columns:
        - label: 前三种
          dot: var(--tab-1)
          items:
            - 'Chain — 渲染流水线：请求数据→更新 state→触发渲染→浏览器绘制，前后有严格顺序，并每一步只接收上一步的输出'
            - 'Parallel — Promise.all 请求：A/B/C 三个接口一起并发，而业务最后要等最慢的那个接口返回，再聚合处理逻辑'
            - 'Route — 前端路由：URL 根据路由表匹配规则决定该渲染哪个组件、走哪套逻辑'
        - label: 后三种
          dot: var(--tab-warn)
          items:
            - 'Loop — 二分定位法：通过二分法寻找 bug，分析问题所在领域，注释一半的代码，然后保存，看效果，问题还在，再注释一半的代码，直到最终问题不再出现，即可定位到问题所在代码块，即可终止定位循环'
            - 'Orchestrate — GitLab CI 工作流编排：通过 yaml 编排定义任务、依赖、条件分支、失败策略，并发跑 lint / test / build 等任务，最后等结果汇总再决定能不能发布'
            - 'Hierarchy — 项目分工：技术负责人 → 模块负责人 → 实现成员；模块负责人还可以继续拆任务，每一层只管理自己负责的局部'

    - type: grid
      section: '2'
      kicker: '03'
      heading: Agent 执行拓扑的六种基础模式
      columns: 3
      cards:
        - num: '01'
          title: Chain 链式
          desc: 传 — 上一步输出就是下一步输入
        - num: '02'
          title: Parallel 并行
          desc: 撒 — 扇出多路，关键在 merge
        - num: '03'
          title: Route 路由
          desc: 选 — 先判断类型，再走对应路径
        - num: '04'
          title: Loop 循环
          desc: 转 — 生成、评估、修订，直到收敛
        - num: '05'
          title: Orchestrate 编排
          desc: 协 — 中心节点拆任务、分发、汇总
        - num: '06'
          title: Hierarchy 层级
          desc: 分 — 多层委派，父管目标，子管局部

    - type: quote
      section: '2'
      eyebrow: 往深一层想
      quote: 拓扑不只是"先做什么、后做什么"的流程图，它决定的是资源在系统里怎么传播。

    - type: table
      section: '2'
      kicker: 拓扑决定了什么
      heading: 五件事，都由拓扑的形状决定
      headers: [维度, 拓扑在管什么, 举例]
      rows:
        - [数据, 节点间怎么流, 链式逐步传递]
        - [控制权, 谁接手、怎么交接, Route 一判定型]
        - [错误, 怎么扩散、在哪爆发, 链一路带下；并行汇合爆发；层级衰减失真]
        - [延迟, 怎么叠加, 并行会等待最慢的那个；链式累加]
        - [责任, 最终落在谁头上, Orchestrate 编排汇总结果；Hierarchy 层级分责兜底]
      lead: 不是靠某个节点自己做得足够好就能补救。选拓扑，就是在选这五件事分别会怎么发生。

    - type: diagram
      section: '2'
      kicker: '04 · Chain'
      heading: 链式 — 上一步的输出，是下一步的输入
      mermaid: |
        flowchart LR
            classDef step fill:#98d4bb,stroke:#70b898,color:#201d18
            A["请求数据"]:::step
            B["更新 state"]:::step
            C["触发渲染"]:::step
            D["浏览器绘制"]:::step
            A --> B --> C --> D
      lead: 链越长，上一环的问题越难被发现。接口数据错了，state 层只会照单全收，渲染层只会想着怎么把它渲染得像模像样，没人会想起回头查一下请求那一步是不是出了什么问题。

    - type: showcase
      section: '2'
      kicker: Chain · 实例
      heading: 'executing-plans：加载、执行、收尾三步走'
      skill: executing-plans
      code: |
        ## 三步流程
        1. 加载并审查计划
           读计划文件，critically 检查有无疑虑
           有疑虑先找人对齐；没有疑虑，建 todo 继续
        2. 逐任务执行
           标记 in_progress → 严格按步骤做
           → 按计划要求验证 → 标记 completed
        3. 收尾
           全部完成后转入 finishing-a-development-branch

        ## 中途遇到阻塞就停
        依赖缺失 / 测试失败 / 指令不清楚 → 停下来问，别猜
      mermaid: |
        flowchart LR
            classDef step fill:#98d4bb,stroke:#70b898,color:#201d18
            A["加载并审阅计划"]:::step
            B["逐任务执行\n标记+验证"]:::step
            C["收尾\n转交后续 Skill"]:::step
            A --> B --> C
      lead: 每一步的产出由 Skill 要求写进对话或 Todo，下一步自然读取就等于拿到了上一步的输出。Chain 靠上下文维持管道，不需要显式传参，但中途遇到阻塞必须停下来问，不能靠猜往下走。
      refs:
        - label: executing-plans
          href: https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md

    - type: diagram
      section: '2'
      kicker: '05 · Parallel'
      heading: 并行 — 没有强依赖，就可以同时执行
      mermaid: |
        flowchart LR
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef worker fill:#c7b8ea,stroke:#a89ed4,color:#201d18
            In["发起请求"]:::io
            W1["用户信息"]:::worker
            W2["商品列表"]:::worker
            W3["推荐位"]:::worker
            M["Promise.all\n合并渲染"]:::io
            In --> W1 & W2 & W3 --> M
      lead: 并行的关键在"合并"，不在"发起"。三个请求一起发很容易，谁超时、谁失败、要不要兜底，才是真正考验 merge 逻辑的地方。没有好的合并策略，并行只会让出错的机会变得更大。

    - type: showcase
      section: '2'
      kicker: Parallel · 实例
      heading: 'dispatching-parallel-agents：按问题域拆分派发'
      skill: dispatching-parallel-agents
      code: |
        ## 真实案例：3 个文件、6 个失败测试
        - agent-tool-abort.test.ts：3 个失败（时序问题）
        - batch-completion-behavior.test.ts：2 个失败
        - tool-approval-race-conditions.test.ts：1 个失败

        ## 工作流
        1. 识别独立域：按问题领域分组，互不影响才能并行
        2. 构造任务：每个 agent 给范围、目标、约束、期望输出
        3. 一条消息内同时派发三个 agent（分开发就是串行）
        4. 审查整合：读摘要、查冲突、跑一次完整测试
      mermaid: |
        flowchart LR
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef worker fill:#c7b8ea,stroke:#a89ed4,color:#201d18
            In["6 个失败测试\n按独立领域分组"]:::io
            A1["Agent 1\nabort 测试"]:::worker
            A2["Agent 2\nbatch 测试"]:::worker
            A3["Agent 3\nrace 测试"]:::worker
            Out["审查整合\n跑完整测试"]:::io
            In --> A1 & A2 & A3 --> Out
      lead: 三个 agent 必须写进同一条消息里同时派生（dispatch/spawn）才算并行，如果还是一个一个来就退化成串行；收尾那一次完整测试，是唯一能发现各 agent 的返回，彼此之间是否会互相冲突的机会（比如有没有改到共享逻辑）。
      refs:
        - label: dispatching-parallel-agents
          href: https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md

    - type: diagram
      section: '2'
      kicker: '06 · Route'
      heading: 路由 — 不同输入，走不同路径
      mermaid: |
        flowchart TD
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef route fill:#f4b8c5,stroke:#d89aab,color:#201d18
            classDef step fill:#f4b8c5,stroke:#d89aab,color:#201d18
            In["URL 变化"]:::io
            R{{"路由匹配"}}:::route
            A["列表页组件"]:::step
            B["详情页组件"]:::step
            C["404 页面"]:::step
            Out["渲染"]:::io
            In --> R
            R -- "/list" --> A
            R -- "/detail/:id" --> B
            R -- "未匹配" --> C
            A & B & C --> Out
      bullets:
        - Route 的核心是路由规则写得准不准：匹配错了，页面组件再精致也没用
        - 路由的价值通常在于让 URL 和视图状态对应清楚，不在于让某个页面本身变强

    - type: showcase
      section: '2'
      kicker: Route · 实例
      heading: 'prototype：先分清楚问的是哪种问题'
      skill: prototype
      code: |
        ## 先识别问题类型
        - "这个逻辑 / 状态模型对不对？"
          → LOGIC.md：写一个可交互终端小程序，
            把状态机推过那些纸面上难判断的分支
        - "这东西该长什么样？"
          → UI.md：在同一路由上做出几种风格迥异的变体，
            用 URL 参数 + 悬浮工具条切换

        ## 分岔即定型
        两个分支产出完全不同的东西——分错了，
        整个 prototype 就白做
      mermaid: |
        flowchart TD
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef route fill:#f4b8c5,stroke:#d89aab,color:#201d18
            classDef step fill:#f4b8c5,stroke:#d89aab,color:#201d18
            In["要验证的问题"]:::io --> R{{"问的是哪种？"}}:::route
            R -- "逻辑/状态模型" --> A["LOGIC.md\n可交互终端程序"]:::step
            R -- "长什么样" --> B["UI.md\n多套 UI 变体"]:::step
            A & B --> Out["答案\n是唯一该留下的"]:::io
      lead: 问题真的模糊、又联系不到人时，Skill 给了兜底规则：按代码类型判断，后端模块归 LOGIC，页面或组件归 UI，并在开头写明这是个假设。
      refs:
        - label: prototype
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md

    - type: diagram
      section: '2'
      kicker: '07 · Loop'
      heading: 循环 — 执行、验证、修正，直到收敛
      mermaid: |
        flowchart LR
            classDef gen fill:#a8d8ea,stroke:#80b8ce,color:#201d18
            classDef critic fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef done fill:#d4c9b8,stroke:#b8a898,color:#201d18
            Gen(["注释一半代码"]):::gen
            Critic(["保存看效果"]):::critic
            Done(["问题消失\n定位到代码块"]):::done
            Gen -->|"保存"| Critic
            Critic -->|"问题还在"| Gen
            Critic -->|"问题消失"| Done
      bullets:
        - Loop 是最迷人也最危险的拓扑，能让系统从错误里恢复，也能让错误被不断放大
        - 核心是停止条件、评估信号、每轮改动幅度；写之前先想清楚要 Open Loop 还是 Closed Loop

    - type: table
      section: '2'
      kicker: Loop · 两种写法
      heading: Open Loop 边走边定，Closed Loop 事先定好
      headers: [维度, Open Loop, Closed Loop]
      rows:
        - [目标, 开放，边走边定, 有界，事先定好]
        - [路径可见性, 走的时候才知道, 大致看得清]
        - [验收, 模糊，靠 Agent 自判, 明确，每步可判定]
        - [开销, 难预估, 可控、可估]
        - [适用场景, 探索、找方向, 交付确定的事]
      lead: Closed Loop 更常用：更确定、更可控。可控的关键往往在验收是客观的，比如「问题还在 / 消失」、测试、typecheck。写 Skill 时先尝试 Closed Loop，把客观验收标准定义清楚，再让 loop 跑起来。

    - type: showcase
      section: '2'
      kicker: Loop · Closed Loop 实例
      heading: 'tdd：Red-Green 循环，重构故意排除在外'
      skill: tdd
      code: |
        ## 循环规则
        - 先与人确认要测的边界（seam）
          没确认的边界不写测试
        - Red before Green：先写会失败的测试
          再写刚好让它通过的最小代码
        - 一次一个切片：一个边界、一个测试、一个实现
        - 重构不属于这个循环
          它属于 review 阶段，不混进 red → green

        ## 为什么是 Closed Loop
        每轮验收只有两个答案：测试失败 / 通过
        目标有界（一个 seam），开销可估（一次一切片）
      mermaid: |
        flowchart LR
            classDef gen fill:#a8d8ea,stroke:#80b8ce,color:#201d18
            classDef critic fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef done fill:#d4c9b8,stroke:#b8a898,color:#201d18
            Red["写失败测试\nRed"]:::gen --> Green["最小实现\nGreen"]:::gen
            Green --> T{"测试通过？"}:::critic
            T -- "否" --> Green
            T -- "是，还有边界" --> Red
            T -- "是，边界用完" --> D["交给 review\n重构在此阶段"]:::done
      lead: 测试过 / 不过就是客观验收，和上面二分定位里「问题还在 / 消失」是一类信号。red→green 只负责让行为正确；重构被故意排除在循环外，一旦把「顺手重构」也塞进来，测试就分不清自己在验证正确性，还是在给重构背书。
      refs:
        - label: tdd
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md

    - type: code
      section: '2'
      kicker: 'Loop · Open Loop 踩坑'
      heading: 没有客观验收时，Loop 会长什么样
      code: |
        第  1 轮："改了三处，语气更自然了"
        第  5 轮："调整了语序，读起来更流畅"
        第 12 轮："改回了第 3 轮的版本，但措辞略有不同"
        第 19 轮："这里还有一处可以再优化"
        第 23 轮："……"

        没有「测试过 / 不过」这种客观信号，
        只有「感觉更好了」——Loop 只会原地打转。
      lead: 对照 TDD 就很清楚：Open Loop 的验收靠 Agent 自判，退出也靠自判。停止条件必须可测量——最大轮数、改动幅度小于阈值，或外部信号介入。缺了客观验收，Loop 就会越改越忙、越忙越偏。

    - type: diagram
      section: '2'
      kicker: '08 · Orchestrate'
      heading: 编排 — 谁来协调，谁做最终判断
      mermaid: |
        flowchart TD
            classDef orch fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            Orch(["CI 编排\n发布前检查"]):::orch
            W1["Lint"]:::worker
            W2["Test"]:::worker
            W3["Build"]:::worker
            Orch --> W1 & W2 & W3
            W1 & W2 & W3 -.->|"结果回传"| Orch
      lead: GitLab CI 的 release job 通过 yaml 定义 lint / test / build 的触发顺序和失败策略，中心节点只管派发任务、汇总结果，业务代码由各个 job 自己跑，这就是 Orchestrate。失败模式通常是拆错边界：该顺序执行的塞进并行（比如 build 其实依赖 lint 先过），该独立跑的又互相等待。

    - type: showcase
      section: '2'
      kicker: Orchestrate · 实例
      heading: 'subagent-driven-development：派实现 + 派复核，双重把关'
      skill: subagent-driven-development
      code: |
        ## 角色分工（任务列表来自另一个计划环节，不是本 Skill 生成）
        Controller — 当前会话，逐任务派发，自己不写代码
        Implementer — 单个任务：实现、测试、提交、自查
        Task Reviewer — 复核 spec 合规 + 代码质量

        ## 单任务流程
        1. 派发 Implementer（带 task brief）
        2. Implementer 实现/测试/提交，报告状态
        3. 派发 Task Reviewer 复核
        4. 有严重（Critical）/重要（Important）问题 → 派 fix subagent → 重新复核
        5. 复核通过才标记完成，进入下一个任务
        全部任务完成后，再派一次全分支 Reviewer 做终审
      mermaid: |
        flowchart TD
            classDef orch fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            classDef critic fill:#f4b8c5,stroke:#d89aab,color:#201d18
            C(["Controller\n逐任务派发"]):::orch
            I["Implementer\n实现 + 测试"]:::worker
            R{"Reviewer\n复核通过？"}:::critic
            F["Fix subagent\n修复问题"]:::worker
            N["标记完成\n进入下一任务"]:::orch
            C --> I --> R
            R -- "否" --> F --> R
            R -- "是" --> N
            N -.->|"还有任务"| C
      lead: 这个 Skill 按任务逐个推进：Controller 派实现、等复核、处理修复，验收通过后才进入下一项。Parallel 关注多件独立任务能否同时做；Orchestrate 关注谁持续管理流程、门禁与最终判断。

      refs:
        - label: subagent-driven-development
          href: https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md

    - type: diagram
      section: '2'
      kicker: '09 · Hierarchy'
      heading: 层级 — 父任务拆子任务，子任务还能再拆
      mermaid: |
        flowchart TD
            classDef mgr fill:#d8b8a0,stroke:#b89882,color:#201d18
            classDef mid fill:#e8d0bc,stroke:#c8b09c,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            Mgr(["技术负责人\n定义整体目标"]):::mgr
            L1(["前端负责人\n负责交互切片"]):::mid
            L2(["服务端负责人\n负责数据切片"]):::mid
            W1["UI Agent"]:::worker
            W2["State Agent"]:::worker
            W3["API Agent"]:::worker
            W4["DB Agent"]:::worker
            Mgr --> L1 & L2
            L1 --> W1 & W2
            L2 --> W3 & W4
      bullets:
        - Orchestrate 描述「中心节点协调多个任务」，Hierarchy 描述「子节点还能继续委派」。两者不是互斥分类：一层调度是 Orchestrate，递归拆下去后也具备 Hierarchy
        - 每层只接收上级切给自己的目标，并负责自己的局部拆解、验收和向上交接；根节点不直接管理所有叶子任务

    - type: showcase
      section: '2'
      kicker: Hierarchy · 实例
      heading: '递归 Subplanner：一层编排如何长成层级树'
      skill: Cursor /orchestrate（递归模式）
      code: |
        ## 分界
        Planner 直接派 Worker → 一层 Orchestrate
        Subplanner 继续发布任务 → 多层 Hierarchy

        ## 节点类型
        Planner    — 拥有全局目标，只发布任务、读交接记录（handoff），不写代码
        Subplanner — 递归的 Planner，只拥有父级切给它的一片范围
        Worker     — 领一个具体任务，做完把交接记录交回派发者
        Verifier   — 对某个目标的验收标准给判决，同样通过交接记录传递结果

        ## 规则
        - 子节点不知道谁会接自己发布的任务
        - 同层节点之间不通气，只有父子之间会传交接记录
        - Git 是唯一共享介质：branch 是代码，交接记录是"发生了什么"
      mermaid: |
        flowchart TD
            classDef mgr fill:#d8b8a0,stroke:#b89882,color:#201d18
            classDef mid fill:#e8d0bc,stroke:#c8b09c,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            P(["Planner\n发布任务"]):::mgr
            SP(["Subplanner\n负责一个切片"]):::mid
            W1["Worker"]:::worker
            W2["Worker"]:::worker
            W3["Worker"]:::worker
            P --> W1
            P --> SP
            SP --> W2 & W3
            W1 -.->|"交接记录"| P
            W2 & W3 -.->|"交接记录"| SP
            SP -.->|"汇总交接记录"| P
      lead: 这里引用 `/orchestrate`，是因为它内部的 Subplanner 可以递归委派。根 Planner 直接调 Worker 时是一层 Orchestrate；Subplanner 再往下拆，执行图才长成 Hierarchy。Worker 只向父级交接，每一层只能看到直接孩子，层级越深越容易丢失全局信息。
      refs:
        - label: Cursor /orchestrate（递归子规划）
          href: https://github.com/cursor/plugins/blob/e46364b8be46000b7df0f260550cd712afbb8d36/orchestrate/skills/orchestrate/SKILL.md

    - type: quote
      section: '3'
      eyebrow: 从模式到 Skill
      quote: 拓扑是任务运行的形状，Skill 是把这种形状写成操作协议。
      lead: 六种模式已经认识完了。接下来不再逐个看形状，而是把共同结构抽出来：什么时候进入、分几步、哪里分支、何时循环、靠什么工具验证，以及最终交付什么。

    - type: grid
      section: '3'
      kicker: '10'
      heading: 在 Skill 里，编排可以拆成五层
      columns: 5
      cards:
        - num: L1
          title: 触发条件
          desc: 何时进入
        - num: L2
          title: 阶段定义
          desc: 拆出可见步骤
        - num: L3
          title: 模式嵌入
          desc: 注入编排规则
        - num: L4
          title: 工具协议
          desc: 用证据代替猜测
        - num: L5
          title: 交付格式
          desc: 约束最终产物
      lead: 从上到下，逐渐从"要不要做、做哪些步骤"收敛到"怎么做、交付什么"。

    - type: code
      section: '3'
      kicker: '11'
      heading: 一个轻型编排 Skill 的最小模型
      code: |
        ## 什么时候使用
        当……时使用；当……时不要使用

        ## 工作流
        1. 判断任务类型        # 路由
        2. 收集上下文          # 并行
        3. 规划 → 执行 → 验证   # 链式 / 循环
        4. 带着证据总结

        ## 输出
        改了什么 · 验证了什么 · 还有什么不确定

    - type: split
      section: '3'
      kicker: '12'
      heading: 工作流什么时候该停下来问用户？
      columns:
        - label: 自己查，别打扰
          dot: var(--tab-1)
          items:
            - 能用读取 / 搜索 / 命令自行确认
            - 只是措辞、格式这类低风险选择
            - 用户已经明确给出方向
        - label: 该问，就给选择题
          dot: var(--tab-warn)
          items:
            - 存在多个合理路径，明显影响产物
            - 即将执行高影响副作用动作
            - 给 2-4 个选项，推荐项放第一位

    - type: quote
      section: '4'
      eyebrow: 从流程到确定性
      quote: 流程写清楚，只解决了怎么走；执行者是概率模型，还要解决怎么收口。
      lead: Skill 可以规定步骤、分支和交互边界，但不能让模型天然变成确定性程序。接下来要看的是：哪些地方可以保留自由，哪些判断必须留下状态、证据和硬门禁。

    - type: diagram
      section: '4'
      kicker: '13'
      heading: 概率模型，也能有确定的落点
      mermaid: |
        flowchart LR
            classDef loose fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef mid fill:#a8d8ea,stroke:#80b8ce,color:#201d18
            classDef tight fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef hero fill:#c14a3a,stroke:#9c3628,color:#fff
            A["语言表达\n允许自由变化"]:::loose
            B["决策过程\n尽量稳定"]:::mid
            C["外部动作\n必须可控"]:::tight
            D["交付结果\n必须可验证"]:::hero
            A --> B --> C --> D
      lead: 越往右，越不能靠模型自己摸索。不是要把随机性消掉，而是在该约束的地方约束到位。

    - type: quote
      section: '4'
      eyebrow: 从约束到预算
      quote: The model spends; the harness budgets. 模型负责花，Harness 负责控制预算。
      lead: 这些约束不能继续依赖模型自觉。最大轮数需要计数器，改动阈值需要比较器，外部动作需要权限门禁，客观验收需要模型之外的事实依据。模型负责生成下一步，Harness 负责记录状态、核验条件，并在目标达成或预算耗尽时停止。

    - type: grid
      section: '4'
      kicker: Harness · 循环内预算
      heading: 一个 Agent 自己转起来，主要控制五笔预算
      columns: 3
      cards:
        - num: '01'
          title: 感知 · 注意力预算
          desc: 什么信息进入上下文？先做 Context Triage，避免看得太多，等于什么都没看见
        - num: '02'
          title: 记忆 · 连续性预算
          desc: 什么值得跨时间保留？当前上下文是工作台，不是保存全部历史的仓库
        - num: '03'
          title: 推理 · 不确定性预算
          desc: 这道题值得想多深？简单问题快速判断，复杂问题再分解、验证和回溯
        - num: '04'
          title: 行动 · 不可逆预算
          desc: 哪些动作能直接做？读文件和部署服务风险不同，高风险动作必须经过权限与门禁
        - num: '05'
          title: 反思 · 校正预算
          desc: 允许检查和修正几轮？客观验收决定是否继续，Harness 负责限制次数并强制退出
      lead: Loop 里的最大轮数和客观验收，都属于反思的校正预算；推理预算管的是这道题值得想多深。更完整地看，一个 Agent 一直在分配有限资源：看什么、记什么、想多深、能做什么，以及允许回头改几次。

    - type: split
      section: '4'
      kicker: Harness · 外层预算
      heading: 一个 Agent 装不下时，还要再控制两笔预算
      columns:
        - label: 协作 Collaboration · 分工预算
          dot: var(--tab-2)
          items:
            - 回答任务怎么拆给多个 Agent
            - 切开上下文、工具、目标和责任
            - 价值来自专业化和隔离，不是让一群 Agent 聊天
            - 失败信号：大家什么都知道，也一起被噪声淹没
        - label: 治理 Governance · 信任预算
          dot: var(--tab-warn)
          items:
            - 回答能力如何被限制、记录、审计和追责
            - 审批门控、爆炸半径控制、可观测性、钩子管线
            - 它是工具调用同层的运行时机制，不是事后补文档
            - Agent 越强，越要做到可见、可停、可回放
      lead: 五笔预算让单个 Agent 转起来；协作负责在装不下时分流，治理负责给所有循环划边界。
    - type: grid
      section: '4'
      kicker: '14'
      heading: 六个让结果更可控的做法
      columns: 3
      cards:
        - num: '1'
          title: 显式状态
          desc: 把当前阶段、关键决策和完成条件写出来（比如TODO），让下一轮能准确接住
        - num: '2'
          title: 受限选择
          desc: 能枚举的决策改成选项，减少模型临场发挥和反复摇摆
        - num: '3'
          title: 工具校验
          desc: 用测试、typecheck、查询结果判断，不靠模型自己宣布完成
        - num: '4'
          title: 循环预算
          desc: 限制轮数、时间或 Token；每轮失败后必须更新假设
        - num: '5'
          title: 副作用门禁
          desc: 发布、删除、发信等高风险动作集中审批，并尽量保留回滚能力
        - num: '6'
          title: 交付检查清单
          desc: 提交前逐项核对产物、验证证据和遗留风险，避免漏掉收尾
      lead: 这六个做法的共同点，是把关键判断从模型的临场自觉，变成 Harness 可以记录、验证和拦截的外部机制。

    - type: split
      section: '4'
      kicker: '15'
      heading: 注意轻型编排的边界
      columns:
        - label: 适合轻型编排
          dot: var(--tab-1)
          items:
            - 日常 AI Coding 操作规范
            - 写作、Review、调研、排障
            - 半结构化：目标明确，输入多变
        - label: 更适合重型系统
          dot: var(--tab-warn)
          items:
            - 多小时运行的数据管道
            - 涉及资金、权限、生产发布
            - 高风险自动化闭环
      lead: 但「更适合重型」不等于「放弃 Skill」。确定性（Graph，像函数）和自主性（Skill，像对话）本就是互补的两侧——把必须确定的那一段（一条数据管道、一次发布流程）封装成一个工具，确定性锁在工具内部，何时调用、拿结果做什么仍交给 Skill 决策。越过边界是给 Skill 添一件确定性工具，不是推翻它。

    - type: split
      section: '4'
      kicker: '16'
      heading: 六种拓扑在 Skill 轻编排模式下的可靠性分析
      columns:
        - label: 日常够用
          dot: var(--tab-1)
          items:
            - Chain：顺序执行，context 天然维持状态
            - Route：分类条件写清楚即可
            - Loop：写成 Closed Loop，客观验收可控
        - label: 注意边界
          dot: var(--tab-warn)
          items:
            - Parallel：能指导并行，结果回收有丢失风险
            - Orchestrate：子任务多了，协调者开始失忆
            - Hierarchy：深层级时父任务失去全局视角
      lead: 这是基于 context window 行为和前面案例得到的工程判断，不是 benchmark 结论。Parallel / Orchestrate / Hierarchy 超过一定规模，就该把这一段封装成确定性工具（如 LangGraph 编排）交回 Skill 调用，而不是强迫 Skill 做不擅长的事。

    - type: bullets
      section: '5'
      kicker: '17'
      heading: 最后，如果只记住三件事
      bullets:
        - '<strong>执行拓扑</strong>就是给复杂任务建立结构：Chain 处理顺序，Parallel 处理并发，Route 处理分支，Loop 处理迭代，Orchestrate 处理协调，Hierarchy 处理拆解'
        - 在 Skill 中实现一定程度的编排，不一定用到 DAG，把触发条件、阶段、分支、循环退出、工具协议、交付格式写清楚就够了
        - '概率模型不可能保证确定输出（里面还是有太多黑箱，调 prompt 目前还像是手艺活），但可以让<strong>关键过程</strong>尽量确定：显式状态、受限选择、工具校验、循环预算、副作用门禁、检查清单'

    - type: quote
      section: '5'
      quote: 在 Agent 中靠 Skill，六种拓扑都能跑起来；但拓扑越深、协作越多，越要把确定性下沉到 Harness 和工具。
      heading: 谢谢 Thank You
      centered: true
draft: false
---

配套博客：[在 Skill 中"软编排"工作流](/blog/soft-orchestration-in-skills/)。

幻灯片内容已完全结构化在本文件的 frontmatter 中（`deck.slides`），由 Notebook Tabs 模板渲染，点击上方 "Open slides" 查看。
