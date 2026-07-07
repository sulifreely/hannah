---
title: Skill 中的软编排
subtitle: 给 Agent 一条有检查点、有护栏的路线
event: Agent 工程分享 / 2026
date: 2026-07-07
description: 聊聊如何把链式、并行、路由、循环、编排和层级这些工作流模式写进 Skill，让 Agent 不靠玄学提示词乱跑，而是沿着有检查点、有护栏的路线完成复杂任务。
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
      title: 'Skill 中的<br/><span class="accent">软编排</span>'
      lead: '当执行者是一个概率模型时，我们如何给它一条<br/>有检查点、有护栏、但依然轻量的路线。'
      cover: /images/blogs/soft-orchestration-in-skills/00-cover-soft-orchestration-in-skills.jpg
      coverAlt: 没编排乱跑，还是软编排：小蛙在混乱箭头里打转，对比沿着轨道从容前进

    - type: quote
      section: '1'
      eyebrow: 一个天天在用，却很少被追问的问题
      quote: 我们每天都在用 Skill，甚至自己在写 Skill —— 但有没有真正拆开看过，它里面到底藏着哪些结构、哪些模式？
      lead: 今天想和大家一起，把这层"结构"挖出来看看。

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
            - 把每一步焐死成代码节点
        - label: 软编排
          dot: var(--tab-warn)
          items:
            - 写进 Skill 的操作手册
            - 顺序、分叉、检查点、退出条件
            - 把行动边界写清楚，而非焐死

    - type: quote
      section: '1'
      quote: 一个复杂任务，应该按什么顺序、以什么边界、由谁来完成？
      lead: 编排要回答的，就是这一句话。任务足够简单时不需要它；任务一复杂，就会长出岔路。

    - type: code
      section: '1'
      kicker: '02'
      heading: 今天想聊三件事
      code: Skill = 指令 + 编排模式 + 工具协议 + 验证门禁
      bullets:
        - 常见的六类编排模式：链式、并行、路由、循环、编排、层级
        - 这些模式在 Skill 里怎么落地表达
        - 执行者是概率模型时，如何尽量保障结果确定

    - type: grid
      section: '2'
      kicker: '03'
      heading: 六种常见编排模式
      columns: 3
      cards:
        - num: '01'
          title: Chain 链式
          desc: 上一步输出是下一步输入
        - num: '02'
          title: Parallel 并行
          desc: 子任务互不依赖，同时收集
        - num: '03'
          title: Route 路由
          desc: 不同输入走不同路径
        - num: '04'
          title: Loop 循环
          desc: 执行、验证、修正、收敛
        - num: '05'
          title: Orchestrate 编排
          desc: 中心协调者拆任务、做判断
        - num: '06'
          title: Hierarchy 层级
          desc: 父任务拆子任务，逐层收敛

    - type: chain
      section: '2'
      kicker: '04 · Chain'
      heading: 链式 — 上一步的输出，是下一步的输入
      steps:
        - label: 理解需求
        - label: 读取上下文
        - label: 制定方案
        - label: 执行修改
        - label: 验证结果
      lead: 关键不是编号本身，而是每一步的输入输出要清楚 —— 没看清楚火从哪冒出来，就急着往墙上浇水，只会把屋子弄得更湿。
      refs:
        - label: executing-plans
          href: https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md

    - type: branch
      section: '2'
      kicker: '05 · Parallel'
      heading: 并行 — 没有强依赖，就同时做
      hero: '主任务：理解模块'
      branches:
        - 查入口
        - 查模型
        - 查测试
        - 查改动
      ghost: 统一格式，汇总上下文
      lead: 并行的收益是快，风险是散。Skill 要把"散"收回来：各查各的边界，但按同一种格式把证据交回来。
      refs:
        - label: dispatching-parallel-agents
          href: https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md
        - label: code-review
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md

    - type: branch
      section: '2'
      kicker: '06 · Route'
      heading: 路由 — 不同输入，走不同路径
      hero: 用户请求
      branches:
        - 实现
        - 调试
        - Review
        - 写作
      bullets:
        - 好的路由规则有三层：何时用、何时不用、进入后怎么细分
        - 条件一模糊，模型就会凭语感选路 —— 路牌不能只写"差不多往那边"
      refs:
        - label: prototype
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md
        - label: triage
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/triage/SKILL.md

    - type: chain
      section: '2'
      kicker: '07 · Loop'
      heading: 循环 — 执行、验证、修正，直到收敛
      steps:
        - label: 执行
        - label: 验证
        - label: 通过？
          variant: ghost
        - label: 结束
          variant: hero
      retry: '不通过：分析失败原因、更新假设，再回到"执行"'
      bullets:
        - 一定要写清楚退出条件，否则会烧干上下文和耐心
        - 最多重复 N 次，每轮都要留下判断记录，不是瞎撞
      refs:
        - label: loop-on-ci
          href: https://github.com/cursor/plugins/blob/0452e08a314c03621ec5ac1324f1ad1dd824f1a4/cursor-team-kit/skills/loop-on-ci/SKILL.md
        - label: tdd
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md
        - label: diagnosing-bugs
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md

    - type: branch
      section: '2'
      kicker: '08 · Orchestrate'
      heading: 编排 — 谁来协调，谁做最终判断
      hero: '编排者：定义边界 · 保留最终判断'
      branches:
        - 读代码
        - 调搜索
        - 子 Agent
        - 跑测试
      lead: 和并行的区别：Parallel 关注"能不能同时做"，Orchestrate 关注"谁来决定下一步"。工具和子 Agent 能搬砖，但房子歪没歪，得有人抬头看一眼。
      refs:
        - label: subagent-driven-development
          href: https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md

    - type: branch
      section: '2'
      kicker: '09 · Hierarchy'
      heading: 层级 — 父任务拆子任务，子任务还能再拆
      hero: '父任务：迁移组件体系'
      branches:
        - 梳理现状
        - 设计目标 API
        - 实现脚本
        - 补测试文档
      bullets:
        - 子任务必须带明确的输入、输出、边界
        - 父任务必须在关键节点重新汇总，不能一路放飞
      refs:
        - label: orchestrate
          href: https://github.com/cursor/plugins/blob/e46364b8be46000b7df0f260550cd712afbb8d36/orchestrate/skills/orchestrate/SKILL.md
        - label: to-issues
          href: https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md

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
      lead: 越往右，越不能靠模型"自由发挥"。我们不是把风变成石头，而是给帆、舵和锚各自安排好位置。

    - type: grid
      section: '4'
      kicker: '14'
      heading: 六条压住"确定性光谱"右侧的做法
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

    - type: bullets
      section: '5'
      kicker: '16'
      heading: 如果只记住三件事
      bullets:
        - '<strong>编排的本质</strong>是给复杂任务建立结构 —— Chain 处理顺序，Parallel 处理并发，Route 处理分支，Loop 处理迭代，Orchestrate 处理协调，Hierarchy 处理拆解'
        - 在 Skill 中实现编排，不一定要写成 DAG —— 把触发条件、阶段、分支、循环退出、工具协议、交付格式写清楚就够了
        - '概率模型不可能天然确定，但可以让<strong>关键过程</strong>尽量确定：显式状态、受限选择、工具校验、循环预算、副作用门禁、检查清单'

    - type: quote
      section: '5'
      quote: Skill 不是魔法咒语，而是一份工程操作手册 —— 把路径写清楚，该自由发挥时自由发挥，该踩刹车时就踩刹车。
      heading: 谢谢 Thank You
      centered: true
draft: false
---

配套博客：[在 Skill 中"软编排"工作流](/blog/soft-orchestration-in-skills/)。

幻灯片内容已完全结构化在本文件的 frontmatter 中（`deck.slides`），由 Notebook Tabs 模板渲染，点击上方 "Open slides" 查看。
