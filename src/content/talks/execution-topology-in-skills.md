---
title: 趣谈 Skill 中的执行拓扑
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
      title: 'Skill 中的<br/><span class="accent">执行拓扑</span>'
      lead: '六种编排模式在 Skill 侧的可靠性并不均匀——<br/>哪些日常够用，哪些一上量就容易出问题。'
      cover: /images/talks/execution-topology-reliability.png
      coverAlt: 左边角色沿单一箭头稳步前进（日常够用），右边角色被多路 worker 的箭头淹没、抓着电话找 LangGraph 求救（规模变大）

    - type: quote
      section: '1'
      eyebrow: 一个自然而然的问题
      quote: Agent 执行拓扑已经有成熟的模式归纳。问题是：不上重型 workflow 框架，靠一份 Skill 能不能把这些模式跑起来？
      lead: 今天想一起验证一下，这条路到底能走多远。

    - type: split
      section: '1'
      kicker: '01'
      heading: 两种编排，两种重量
      columns:
        - label: 硬编排
          dot: var(--text-faint)
          items:
            - 状态机 / DAG / workflow engine
            - 可视化节点，拖拽调度
            - 把每一步写死成代码节点
        - label: 软编排
          dot: var(--tab-warn)
          items:
            - 写进 Skill 的操作手册
            - 顺序、分叉、检查点、退出条件
            - 把行动边界写清楚，而非写死

    - type: quote
      section: '1'
      quote: 一个复杂任务，应该按什么顺序、以什么边界、由谁来完成？
      lead: 编排回答的就是这一个问题。任务简单时用不着；任务一复杂，岔路自然就有了。

    - type: diagram
      section: '1'
      kicker: '02'
      heading: 今天想聊三件事
      mermaid: |
        flowchart LR
            classDef input fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef skill fill:#c14a3a,stroke:#9c3628,color:#fff
            A["指令"]:::input --> S(["Skill"]):::skill
            B["编排模式"]:::input --> S
            C["工具协议"]:::input --> S
            D["验证门禁"]:::input --> S
      bullets:
        - Agent 执行拓扑的六类基础模式：链式、并行、路由、循环、编排、层级
        - 这些模式在 Skill 里怎么表达（而不是用重型 workflow 引擎）
        - 执行者是概率模型时，如何尽量保障结果确定

    - type: split
      section: '2'
      kicker: 先认识它们
      heading: 六种模式，你其实每天都在遇到
      columns:
        - label: 前三种
          dot: var(--tab-1)
          items:
            - 'Chain — 渲染流水线：请求数据→更新 state→触发渲染→浏览器绘制，每一步只认上一步吐出来的东西'
            - 'Parallel — Promise.all 请求：用户信息、商品列表、推荐位三个接口一起发，最后要等最慢的那个'
            - 'Route — 前端路由：URL 一变，该渲染哪个组件、走哪套逻辑，全看路由表怎么写'
        - label: 后三种
          dot: var(--tab-warn)
          items:
            - 'Loop — HMR 调试循环：改一行代码→保存→热更新→看效果→不对再改，改着改着已经忘了最初想解决什么问题'
            - 'Orchestrate — CI 里的 release job：并发跑 lint / test / build，自己不写业务代码，只等结果汇总再决定能不能发布'
            - 'Hierarchy — Monorepo 多层 workspace：根 workspace 管几个 package，每个 package 内部子模块怎么拆、谁维护，根本看不到'

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
      refs:
        - label: executing-plans
          href: https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md

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
            A["加载计划\n审查疑虑"]:::step
            B["逐任务执行\n标记+验证"]:::step
            C["收尾\n转交后续 Skill"]:::step
            A --> B --> C
      lead: 每一步的产出由 Skill 要求写进对话或 todo，下一步自然读取。Chain 靠 context 维持管道，不需要显式传参，但中途遇到阻塞必须停下来问，不能靠猜往下走。

    - type: diagram
      section: '2'
      kicker: '05 · Parallel'
      heading: 并行 — 没有强依赖，就同时做
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
      lead: 并行的关键在"合并"，不在"发起"。三个请求一起发很容易，谁超时、谁失败、要不要兜底，才是真正考验 merge 逻辑的地方。没有好的合并策略，并行只是把出错的机会并行化。
      refs:
        - label: dispatching-parallel-agents
          href: https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md
        - label: code-review
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md

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
        1. 识别独立域：按"坏在哪"分组，互不影响才能分
        2. 构造任务：每个 agent 给范围、目标、约束、期望输出
        3. 一条消息内同时派发三个 agent（分开发就是串行）
        4. 审查整合：读摘要、查冲突、跑一次完整测试
      mermaid: |
        flowchart LR
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef worker fill:#c7b8ea,stroke:#a89ed4,color:#201d18
            In["6 个失败测试\n按文件分域"]:::io
            A1["Agent 1\nabort 测试"]:::worker
            A2["Agent 2\nbatch 测试"]:::worker
            A3["Agent 3\nrace 测试"]:::worker
            Out["审查整合\n跑完整测试"]:::io
            In --> A1 & A2 & A3 --> Out
      lead: 三个 agent 必须写进同一条消息里派发才算并行，分成三条就退化成串行；收尾那一次完整测试，是唯一能发现 agent 之间是否互相踩到的机会。

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
      refs:
        - label: prototype
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md
        - label: triage
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/triage/SKILL.md

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

    - type: diagram
      section: '2'
      kicker: '07 · Loop'
      heading: 循环 — 执行、验证、修正，直到收敛
      mermaid: |
        flowchart LR
            classDef gen fill:#a8d8ea,stroke:#80b8ce,color:#201d18
            classDef critic fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef done fill:#d4c9b8,stroke:#b8a898,color:#201d18
            Gen(["改代码"]):::gen
            Critic(["保存看效果"]):::critic
            Done(["符合预期 ✓"]):::done
            Gen -->|"保存"| Critic
            Critic -->|"还不对"| Gen
            Critic -->|"对了"| Done
      bullets:
        - Loop 是最迷人也最危险的拓扑，能让系统从错误里恢复，也能让错误被不断放大
        - 核心是停止条件、评估信号、每轮改动幅度这三件事，缺一个都可能让循环转不出来
      refs:
        - label: loop-on-ci
          href: https://github.com/cursor/plugins/blob/0452e08a314c03621ec5ac1324f1ad1dd824f1a4/cursor-team-kit/skills/loop-on-ci/SKILL.md
        - label: tdd
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md
        - label: diagnosing-bugs
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md

    - type: showcase
      section: '2'
      kicker: Loop · 实例
      heading: 'tdd：Red-Green 循环，重构故意排除在外'
      skill: tdd
      code: |
        ## 循环规则
        - 先与人确认要测的 seam（公开边界）
          没确认的 seam 不写测试
        - Red before Green：先写会失败的测试
          再写刚好让它通过的最小代码
        - 一次一个切片：一个 seam、一个测试、一个实现
        - 重构不属于这个循环
          它属于 review 阶段，不混进 red → green

        ## 单个切片
        写失败测试 → 写最小实现 → 通过？
          否，回到写实现；是，切下一个 seam
      mermaid: |
        flowchart LR
            classDef gen fill:#a8d8ea,stroke:#80b8ce,color:#201d18
            classDef critic fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef done fill:#d4c9b8,stroke:#b8a898,color:#201d18
            Red["写失败测试\nRed"]:::gen --> Green["最小实现\nGreen"]:::gen
            Green --> T{"测试通过？"}:::critic
            T -- "否" --> Green
            T -- "是，还有 seam" --> Red
            T -- "是，seam 用完" --> D["交给 review\n重构在此阶段"]:::done
      lead: 重构被故意排除在这个循环之外。red→green 只负责让行为正确，一旦把"顺手重构"也塞进循环，测试就分不清自己在验证正确性还是在给重构背书。

    - type: code
      section: '2'
      kicker: 'Loop · 踩坑'
      heading: 没有停止条件的 Loop 长什么样
      code: |
        第  1 轮："改了三处，语气更自然了"
        第  5 轮："调整了语序，读起来更流畅"
        第 12 轮："改回了第 3 轮的版本，但措辞略有不同"
        第 19 轮："这里还有一处可以再优化"
        第 23 轮："……"

        Critic 永远能找到可以改的地方。
        没有预算，Loop 只会原地打转，越改越乱。
      lead: 退出条件不是"做好了就停"，Critic 永远能挑出毛病。停止条件必须是可测量的：最大轮数、改动幅度 < 阈值，或外部信号介入。缺了这三件事任意一个，Loop 就会越改越忙、越忙越偏。

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
      lead: CI 里的 release job 自己不跑业务代码，只负责派发 lint / test / build，等结果汇总再判断能不能发布，这就是 Orchestrate。失败模式通常是拆错边界：该顺序执行的塞进并行（比如 build 其实依赖 lint 先过），该独立跑的又互相等待。
      refs:
        - label: subagent-driven-development
          href: https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md

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
        4. 有 Critical/Important 问题 → 派 fix subagent → 重新复核
        5. 复核通过才标记完成，进入下一个任务
        全部任务完成后，再派一次全分支 Reviewer 做终审
      mermaid: |
        flowchart TD
            classDef orch fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            C(["Controller\n逐任务派发"]):::orch
            I1["Implementer\n任务 1"]:::worker
            I2["Implementer\n任务 2"]:::worker
            I3["Implementer\n任务 3"]:::worker
            C --> I1 & I2 & I3
            I1 & I2 & I3 -.->|"实现+复核"| C
      lead: 派发的不是"想法"，而是任务列表，列表来自单独的写计划环节。这个 Skill 真正做的是"实现 + 复核"的双重循环，任何任务没通过复核都不能标记完成，协调者的记忆负担全在"追踪谁复核过、谁还没有"。

    - type: diagram
      section: '2'
      kicker: '09 · Hierarchy'
      heading: 层级 — 父任务拆子任务，子任务还能再拆
      mermaid: |
        flowchart TD
            classDef mgr fill:#d8b8a0,stroke:#b89882,color:#201d18
            classDef mid fill:#e8d0bc,stroke:#c8b09c,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            Mgr(["Root workspace\n定整体版本"]):::mgr
            L1(["packages/ui"]):::mid
            L2(["packages/utils"]):::mid
            W1["Button"]:::worker
            W2["Input"]:::worker
            W3["formatDate"]:::worker
            W4["debounce"]:::worker
            Mgr --> L1 & L2
            L1 --> W1 & W2
            L2 --> W3 & W4
      bullets:
        - Orchestrate 是 CI 直接调度几个 job；Hierarchy 是 root workspace 只管到 package 这一层，package 内部子模块怎么拆、谁维护，root 完全看不到，不是一回事
        - 每层 package.json 必须在关键节点声明清楚依赖版本；子模块必须有明确的导出边界，不能绕过 package 直接 import 内部文件
      refs:
        - label: orchestrate
          href: https://github.com/cursor/plugins/blob/e46364b8be46000b7df0f260550cd712afbb8d36/orchestrate/skills/orchestrate/SKILL.md
        - label: to-issues
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md

    - type: showcase
      section: '2'
      kicker: Hierarchy · 实例
      heading: 'orchestrate：Planner / Subplanner / Worker / Verifier'
      skill: orchestrate
      code: |
        ## 节点类型
        Planner    — 拥有全局目标，只发布任务、读 handoff，不写代码
        Subplanner — 递归的 Planner，只拥有父级切给它的一片范围
        Worker     — 领一个具体任务，做完把 handoff 交回派发者
        Verifier   — 对某个目标的验收标准给判决，同样走 handoff

        ## 规则
        - 子节点不知道谁会接自己发布的任务
        - 同层节点之间不通气，只有父子之间的 handoff
        - Git 是唯一共享介质：branch 是代码，handoff 是"发生了什么"
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
            W1 -.->|"handoff"| P
            W2 & W3 -.->|"handoff"| SP
            SP -.->|"汇总 handoff"| P
      lead: Worker 干完活只往上交一次 handoff，看不到、也不关心兄弟节点在干什么。深层级最容易"失忆"的地方就在这里：每一层只看得到自己直接孩子的 handoff，看不到整棵树。

    - type: bullets
      section: '2'
      kicker: 互动 · 猜猜是哪种拓扑
      heading: 这几个场景，你认得出来吗？
      lead: 每个场景对应哪种模式？
      bullets:
        - '你让 AI 先搜索竞品、再整理要点、再写对比报告 → <strong>Chain</strong>'
        - '你让 AI 同时给三个模块各写一组单元测试，互不依赖 → <strong>Parallel</strong>'
        - '你问 AI 一个 bug，AI 先判断这是逻辑问题还是样式问题，再决定用哪套排查方法 → <strong>Route</strong>'
        - '你说「帮我改这段文字」，AI 返回修改版，你说「再润色一点」……第 8 次你不确定是否更好了 → <strong>Loop（退出条件在哪？）</strong>'
        - '你让 AI 先并发跑 lint / test / build 三项检查，自己不写代码，等结果汇总再决定能不能合并 → <strong>Orchestrate</strong>'
        - 'AI 接到一个完整项目，拆成子任务分给三个 subagent，每个 subagent 发现太大、又各自再拆 → <strong>Hierarchy</strong>'

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
      heading: 一个软编排 Skill 的最小模型
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

    - type: grid
      section: '4'
      kicker: '14'
      heading: 六个让结果更可控的做法
      columns: 3
      cards:
        - num: '1'
          title: 显式状态
          desc: 别让判断只藏在模型心里
        - num: '2'
          title: 受限选择
          desc: 把开放生成变成选择题
        - num: '3'
          title: 工具校验
          desc: 用证据替代模型的自信
        - num: '4'
          title: 循环预算
          desc: 设上限，强制更新假设
        - num: '5'
          title: 副作用门禁
          desc: 高风险动作集中管理
        - num: '6'
          title: 交付检查清单
          desc: 简单、便宜、有效的最后一道门

    - type: split
      section: '4'
      kicker: '15'
      heading: 软编排不是万能药
      columns:
        - label: 适合软编排
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

    - type: split
      section: '4'
      kicker: '16'
      heading: 六种拓扑在 Skill 侧的可靠性不均匀
      columns:
        - label: 日常够用
          dot: var(--tab-1)
          items:
            - Chain：顺序执行，context 天然维持状态
            - Route：分类条件写清楚即可
            - Loop：退出条件写清楚可控
        - label: 注意边界
          dot: var(--tab-warn)
          items:
            - Parallel：能指导并行，结果回收有丢失风险
            - Orchestrate：子任务多了，协调者开始失忆
            - Hierarchy：深层级时父任务失去全局视角
      lead: 以上是基于 context window 行为的推断，不是实测数据。Orchestrate / Hierarchy 超过一定规模，是考虑引入 LangGraph 的信号。

    - type: bullets
      section: '5'
      kicker: '17'
      heading: 如果只记住三件事
      bullets:
        - '<strong>编排</strong>就是给复杂任务建立结构：Chain 处理顺序，Parallel 处理并发，Route 处理分支，Loop 处理迭代，Orchestrate 处理协调，Hierarchy 处理拆解'
        - 在 Skill 中实现编排，不一定要写成 DAG，把触发条件、阶段、分支、循环退出、工具协议、交付格式写清楚就够了
        - '概率模型不可能天然确定，但可以让<strong>关键过程</strong>尽量确定：显式状态、受限选择、工具校验、循环预算、副作用门禁、检查清单'

    - type: quote
      section: '5'
      quote: Skill 不是咒语，是一份操作手册。把路径写清楚，该发挥时发挥，该收住时收住。
      heading: 谢谢 Thank You
      centered: true
draft: false
---

配套博客：[在 Skill 中"软编排"工作流](/blog/soft-orchestration-in-skills/)。

幻灯片内容已完全结构化在本文件的 frontmatter 中（`deck.slides`），由 Notebook Tabs 模板渲染，点击上方 "Open slides" 查看。
