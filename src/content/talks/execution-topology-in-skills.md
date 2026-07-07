---
title: Skill 中的执行拓扑
subtitle: 六种编排模式在 Skill 侧的可靠性与边界
event: Agent 工程分享 / 2026
date: 2026-07-07
description: 聊聊如何把链式、并行、路由、循环、编排和层级这些执行拓扑写进 Skill。六种模式在 Skill 侧的可靠性并不均匀——Chain、Route、Loop 日常够用，Orchestrate 和 Hierarchy 是边界，越过这条线才值得引入 LangGraph 这类重型编排框架。
cover: /images/blogs/soft-orchestration-in-skills/00-cover-soft-orchestration-in-skills.jpg
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
      lead: '六种编排模式在 Skill 侧的可靠性并不均匀——<br/>哪些够用，哪些是边界，边界在哪里。'
      cover: /images/blogs/soft-orchestration-in-skills/00-cover-soft-orchestration-in-skills.jpg
      coverAlt: 没编排乱跑，还是软编排：小蛙在混乱箭头里打转，对比沿着轨道从容前进

    - type: quote
      section: '1'
      eyebrow: 一个自然而然的问题
      quote: Agent 执行拓扑已经有成熟的模式归纳。问题是：不上重型 workflow 框架，靠一份 Skill 能不能把这些模式跑起来？
      lead: 今天想一起看看这条路能走多远，边界在哪里。

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
            A["检索"]:::step
            B["rerank"]:::step
            C["生成"]:::step
            D["引用"]:::step
            A --> B --> C --> D
      lead: 链越长，中间格式越重要。一个节点输出走偏了，下游节点通常不会纠错，反而把错包装得更漂亮。
      refs:
        - label: executing-plans
          href: https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md

    - type: showcase
      section: '2'
      kicker: Chain · 实例
      heading: 'executing-plans：四步顺序管道'
      skill: executing-plans
      code: |
        ## 工作流
        1. 理解目标
           读取目标文件，确认当前状态
        2. 制定计划
           列出变更步骤，让用户确认再继续
        3. 逐步执行
           按顺序完成每步，每步后用工具验证
        4. 收尾验证
           对照计划逐项 check，写最终摘要
      mermaid: |
        flowchart LR
            classDef step fill:#98d4bb,stroke:#70b898,color:#201d18
            A["理解目标\n读取文件"]:::step
            B["制定计划\n用户确认"]:::step
            C["逐步执行\n工具验证"]:::step
            D["收尾验证\n写摘要"]:::step
            A --> B --> C --> D
      lead: 每步产出由 Skill 要求写进对话，下一步自然读取——Chain 靠 context 维持管道，不需要显式传参。

    - type: diagram
      section: '2'
      kicker: '05 · Parallel'
      heading: 并行 — 没有强依赖，就同时做
      mermaid: |
        flowchart LR
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef worker fill:#c7b8ea,stroke:#a89ed4,color:#201d18
            In["输入"]:::io
            W1["w1"]:::worker
            W2["w2"]:::worker
            W3["w3"]:::worker
            M["Σ merge"]:::io
            In --> W1 & W2 & W3 --> M
      lead: 并行的关键在 merge，不在 fan-out。没有好的 merge，并行只是把噪声并行化。
      refs:
        - label: dispatching-parallel-agents
          href: https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md
        - label: code-review
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md

    - type: showcase
      section: '2'
      kicker: Parallel · 实例
      heading: 'dispatching-parallel-agents：扇出 + 显式 Merge'
      skill: dispatching-parallel-agents
      code: |
        ## 何时并行
        各子任务之间无依赖、可同时运行时

        ## 工作流
        1. 分析：列出可独立完成的子任务
        2. 扇出：逐一启动 subagent
           - 每个携带完整 context + 独立工具
        3. 收集：等待所有 subagent 完成
        4. Merge：汇总结果，检查并解决冲突
      mermaid: |
        flowchart LR
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef worker fill:#c7b8ea,stroke:#a89ed4,color:#201d18
            M["主 Agent\n分析+扇出"]:::io
            S1["subagent\n任务 A"]:::worker
            S2["subagent\n任务 B"]:::worker
            S3["subagent\n任务 C"]:::worker
            R["Merge\n汇总+解冲突"]:::io
            M --> S1 & S2 & S3 --> R
      lead: Skill 要求显式收集每个 subagent 的输出——结果能否完整回收，是 Parallel 在 Skill 里最脆弱的一环。

    - type: diagram
      section: '2'
      kicker: '06 · Route'
      heading: 路由 — 不同输入，走不同路径
      mermaid: |
        flowchart TD
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef route fill:#f4b8c5,stroke:#d89aab,color:#201d18
            classDef step fill:#f4b8c5,stroke:#d89aab,color:#201d18
            In["请求"]:::io
            R{{"分类"}}:::route
            A["小模型"]:::step
            B["大模型"]:::step
            C["专家 Agent"]:::step
            Out["输出"]:::io
            In --> R
            R -- "简单" --> A
            R -- "复杂" --> B
            R -- "专业" --> C
            A & B & C --> Out
      bullets:
        - Route 的核心是分类器质量 —— 路由错了，后面再强也很难救
        - 路由的价值通常在于降低平均成本和平均风险，不在于提高上限
      refs:
        - label: prototype
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md
        - label: triage
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/triage/SKILL.md

    - type: showcase
      section: '2'
      kicker: Route · 实例
      heading: 'prototype：按任务规模三路分流'
      skill: prototype
      code: |
        ## 判断任务类型（执行前先分类）
        - 小修复（改动 < 30 行）
          → 直接修改，无需计划
        - 多文件重构
          → 先列变更计划，用户确认后执行
        - 架构 / 接口变更
          → 先提出两种以上方案，讨论后再动
      mermaid: |
        flowchart TD
            classDef io fill:#d4c9b8,stroke:#b8a898,color:#201d18
            classDef route fill:#f4b8c5,stroke:#d89aab,color:#201d18
            classDef step fill:#f4b8c5,stroke:#d89aab,color:#201d18
            In["收到任务"]:::io --> R{{"判断类型"}}:::route
            R -- "小修复" --> A["直接修改"]:::step
            R -- "重构" --> B["先列计划"]:::step
            R -- "架构" --> C["先提方案"]:::step
            A & B & C --> Out["执行输出"]:::io
      lead: 分类条件写得越具体，路由越稳——"< 30 行"比"简单修改"更难误判，Skill 里的 Route 就是一段有量化边界的 if/else。

    - type: diagram
      section: '2'
      kicker: '07 · Loop'
      heading: 循环 — 执行、验证、修正，直到收敛
      mermaid: |
        flowchart LR
            classDef gen fill:#a8d8ea,stroke:#80b8ce,color:#201d18
            classDef critic fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef done fill:#d4c9b8,stroke:#b8a898,color:#201d18
            Gen(["Gen"]):::gen
            Critic(["Critic"]):::critic
            Done(["完 ✓"]):::done
            Gen -->|"生成"| Critic
            Critic -->|"反馈"| Gen
            Critic -->|"收敛"| Done
      bullets:
        - Loop 是最迷人也最危险的拓扑 —— 让系统能从错误中恢复，也让错误有机会复合
        - 核心是停止条件、评估信号和每轮改动幅度；没有这些，Loop 会越改越忙，越忙越偏
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
      heading: 'tdd：红绿重构循环'
      skill: tdd
      code: |
        ## 循环工作流
        1. 写测试 (Red)
           新测试必须先失败
        2. 最小化实现 (Green)
           只写让测试通过的代码
        3. 运行测试
           - 失败 → 修改实现，回到 2
           - 通过 → 继续
        4. 重构 (Refactor)
        5. 重运行测试，有回归回到 4

        ## 退出条件
        所有测试通过，或不超过 5 轮
      mermaid: |
        flowchart LR
            classDef gen fill:#a8d8ea,stroke:#80b8ce,color:#201d18
            classDef critic fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef done fill:#d4c9b8,stroke:#b8a898,color:#201d18
            W["写测试\nRed"]:::gen --> I["最小实现\nGreen"]:::gen --> T{"运行测试"}:::critic
            T -- "失败" --> I
            T -- "通过" --> R["重构\nRefactor"]:::gen --> V{"再次测试"}:::critic
            V -- "回归" --> R
            V -- "全绿" --> D["完成 ✓"]:::done
      lead: TDD 是教科书级 Loop——Gen 写代码，Critic 运行测试，退出条件精确（全测试通过或 5 轮上限）。三件事都在 Skill 里写清楚了。

    - type: diagram
      section: '2'
      kicker: '08 · Orchestrate'
      heading: 编排 — 谁来协调，谁做最终判断
      mermaid: |
        flowchart TD
            classDef orch fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            Orch(["Orch"]):::orch
            W1["w1"]:::worker
            W2["w2"]:::worker
            W3["w3"]:::worker
            Orch --> W1 & W2 & W3
            W1 & W2 & W3 -.-> Orch
      lead: Plan-and-Execute 是典型 Orchestrate：Planner 拆任务，Executor 执行，再汇总。失败模式通常是拆错边界——该用链式的拆成并行，该共享状态的拆成独立，该委派专家的留在中心硬做。
      refs:
        - label: subagent-driven-development
          href: https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md

    - type: showcase
      section: '2'
      kicker: Orchestrate · 实例
      heading: 'subagent-driven-development：Planner-Executor 模型'
      skill: subagent-driven-development
      code: |
        ## 角色分工
        Planner — 分析需求，输出结构化任务列表
        Executor — 接收单个子任务并独立执行

        ## 工作流
        1. Planner 分析需求，输出结构化任务列表
        2. 对每个子任务：
           a. 派发 Executor（携带 context + 工具）
           b. 等待结果，检查输出质量
        3. 所有完成后，Planner 整合汇总
        4. 有缺口则补充派发
      mermaid: |
        flowchart TD
            classDef orch fill:#f0c88a,stroke:#c8a455,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            P(["Planner\n拆解+整合"]):::orch
            E1["Executor\n子任务 A"]:::worker
            E2["Executor\n子任务 B"]:::worker
            E3["Executor\n子任务 C"]:::worker
            P --> E1 & E2 & E3
            E1 & E2 & E3 -.-> P
      lead: Orchestrate 在 Skill 里的失控通常从 Planner 的拆解粒度开始——任务边界不清，Executor 的输出就无法合并，Planner 开始重复派发，context 越用越满。

    - type: diagram
      section: '2'
      kicker: '09 · Hierarchy'
      heading: 层级 — 父任务拆子任务，子任务还能再拆
      mermaid: |
        flowchart TD
            classDef mgr fill:#d8b8a0,stroke:#b89882,color:#201d18
            classDef mid fill:#e8d0bc,stroke:#c8b09c,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            Mgr(["Mgr"]):::mgr
            L1(["L1"]):::mid
            L2(["L2"]):::mid
            W1["w"]:::worker
            W2["w"]:::worker
            W3["w"]:::worker
            W4["w"]:::worker
            Mgr --> L1 & L2
            L1 --> W1 & W2
            L2 --> W3 & W4
      bullets:
        - Orchestrate 是一层中心编排多个 worker；Hierarchy 是多层责任分解，不是一回事
        - 父任务必须在关键节点重新汇总；子任务必须带明确的输入、输出、边界
      refs:
        - label: orchestrate
          href: https://github.com/cursor/plugins/blob/e46364b8be46000b7df0f260550cd712afbb8d36/orchestrate/skills/orchestrate/SKILL.md
        - label: to-issues
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md

    - type: showcase
      section: '2'
      kicker: Hierarchy · 实例
      heading: 'orchestrate：三层委派结构'
      skill: orchestrate
      code: |
        ## 层级分工
        Manager Agent
          → 理解用户意图，分配给 Specialist
        Specialist Agent
          → 负责具体领域，可再分 Worker
        Worker Agent
          → 执行单一操作，返回 diff/结果

        ## 规则
        - 父级只汇总判断，不执行细节
        - 子级携带明确目标、输入和边界
        - 关键节点父级重新汇总全局状态
      mermaid: |
        flowchart TD
            classDef mgr fill:#d8b8a0,stroke:#b89882,color:#201d18
            classDef mid fill:#e8d0bc,stroke:#c8b09c,color:#201d18
            classDef worker fill:#98d4bb,stroke:#70b898,color:#201d18
            Mgr(["Manager\n意图+分配"]):::mgr
            SA(["Specialist A\n领域专家"]):::mid
            SB(["Specialist B\n领域专家"]):::mid
            W1["Worker\n操作"]:::worker
            W2["Worker\n操作"]:::worker
            W3["Worker\n操作"]:::worker
            Mgr --> SA & SB
            SA --> W1 & W2
            SB --> W3
      lead: Manager 不直接操控 Worker，而是通过 Specialist 传递目标——每层只负责自己能看到的边界，不越级干涉，这是 Hierarchy 和 Orchestrate 最本质的区别。

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

    - type: chain
      section: '4'
      kicker: '13'
      heading: 概率模型，也能有确定的落点
      steps:
        - label: '语言表达<br/><span style="opacity:.65">允许自由变化</span>'
        - label: '决策过程<br/><span style="opacity:.65">尽量稳定</span>'
        - label: '外部动作<br/><span style="opacity:.65">必须可控</span>'
        - label: '交付结果<br/><span style="opacity:.8">必须可验证</span>'
          variant: hero
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
        - '<strong>编排的本质</strong>是给复杂任务建立结构 —— Chain 处理顺序，Parallel 处理并发，Route 处理分支，Loop 处理迭代，Orchestrate 处理协调，Hierarchy 处理拆解'
        - 在 Skill 中实现编排，不一定要写成 DAG —— 把触发条件、阶段、分支、循环退出、工具协议、交付格式写清楚就够了
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
