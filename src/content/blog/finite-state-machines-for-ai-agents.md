---
title: 简单聊聊有限状态机
date: 2026-06-01T00:00:00+08:00
description: 从一个提交按钮的状态冲突出发，手写有限状态机的最小实现，再拆开状态、数据和副作用这三层。
tags:
  - 状态管理
---

一个提交按钮，很多人第一反应会写成这样：


```ts
const [loading, setLoading] = useState(false)
const [success, setSuccess] = useState(false)
const [error, setError] = useState<string | null>(null)
```


代码能跑，只是留下几种尴尬组合：`loading` 和 `success` 能不能同时为 `true`？请求失败后再点一次，旧的 `error` 要不要清掉？页面刚打开时，又算哪一种状态？


怎么理解呢？问题往往不在变量怎么存，而在“哪些组合本来就不该出现”。状态机做的事，就是先把这件事定死：合法状态有哪些，允许怎么变，写在同一处。事件处理器就不用反复猜自己现在站在哪。


我们不依赖 XState 或其他库，先手搓一个最小状态机。


## 状态机到底是什么


一个平铺的有限状态机，通常就这几样东西：


- 一组有限的状态。
- 一组有限的事件。
- 一个初始状态。
- 一张迁移表：当前状态遇到某个事件后，能走到哪里。
- 可选的终止状态。


W3C 的 [SCXML 规范](https://www.w3.org/TR/scxml/)也是用状态、事件和迁移描述这套模型：机器处在一个活动状态，收到事件后检查该状态声明的迁移，找到匹配项才走向目标状态。


把它收成一个式子：


```text
NextState = transition(CurrentState, Event)
```


`transition` 本质上是一份许可清单。没写进表里的边，程序就不该走。


### 用灯泡作为示例


灯泡只有三种状态：


```ts
type LightState = 'unlit' | 'lit' | 'broken'
type LightEvent = 'TOGGLE' | 'BREAK'
```


点一下开关，未点亮会变成已点亮；再点一下会回去。灯泡坏掉以后，继续按开关没有意义。把这些规则放进一张表：


```ts
const lightMachine = {
  initial: 'unlit',
  states: {
    unlit: {
      on: { TOGGLE: 'lit', BREAK: 'broken' },
    },
    lit: {
      on: { TOGGLE: 'unlit', BREAK: 'broken' },
    },
    broken: {
      on: {},
    },
  },
} as const
```


“坏掉的灯泡不能再被点亮”，现在写进了模型。`broken` 没有 `TOGGLE` 这条边，调用方就无法从它走到 `lit`。


当然，这里只讲平铺的有限状态机。嵌套、并行和历史状态属于 statechart 的能力，真实产品会用到，但先把这张最小迁移表看明白更重要。


## 最小实现：迁移函数比想象中短


配置有了，核心实现其实就是一次查表：


```ts
type Machine = {
  initial: string
  states: Record<string, { on?: Record<string, string> }>
}

function transition(machine: Machine, state: string, event: string) {
  const next = machine.states[state]?.on?.[event]

  if (!next) {
    return { value: state, changed: false }
  }

  return { value: next, changed: next !== state }
}

transition(lightMachine, 'unlit', 'TOGGLE')
// { value: 'lit', changed: true }

transition(lightMachine, 'broken', 'TOGGLE')
// { value: 'broken', changed: false }
```


可以看到，虽然代码很短，但核心机制已经出现了：合法就往前走，不合法就停在原地。


这里让非法事件保持原状态，适合可以忽略重复点击的 UI。协议或资金流程往往要抛错：收到未声明事件，说明调用方已经违反约定。两种策略本身没有对错，取决于你想把“违规”当成可忽略噪音，还是当成必须暴露的故障。


状态机的骨架到这里就够了。它不发送请求，也不修改 DOM；相同的状态和事件总会得到相同结果，因此很好测试：


```ts
expect(transition(lightMachine, 'lit', 'BREAK')).toEqual({
  value: 'broken',
  changed: true,
})
```


到此为止，它只负责判断下一步是否合法。


## 真实业务多出来的两层


灯泡模型够简单，业务通常没这么客气。提交表单时，除了 `idle`、`submitting`、`success`、`failed`，还要保存输入内容、接口结果和错误原因；迁移时还会触发网络请求、埋点和提示消息。


这些内容一股脑塞进 `transition`，很快就会变成长函数。拆成状态、数据和副作用三层，代码会清爽得多。


### Context 是状态旁边的数据


状态记录流程走到哪，`context` 保存这一步带着的数据。


```ts
type SubmitState = 'editing' | 'submitting' | 'success' | 'failed'

type SubmitContext = {
  form: { email: string }
  error?: string
}

type Snapshot = {
  value: SubmitState
  context: SubmitContext
}
```


接口响应和错误信息放在 `context`，不要硬塞进状态名。否则很快就会长出 `failedWithNetworkErrorAndRetryable` 这种看一眼就累的名字。


简单来说：状态回答“现在在哪一站”，`context` 回答“这一站还带着什么行李”。


### 副作用应该跟着迁移走，但别塞进迁移函数


网络请求、文件写入、发邮件、调外部接口，都属于副作用。它们会发生在某次迁移之后，但不该混进迁移函数。


一个常见做法是让迁移结果带上“接下来要做什么”的描述，再由运行时执行：


```ts
type Result = {
  value: string
  effects: Array<{ type: 'REQUEST' | 'SHOW_ERROR' }>
}

function runEffects(effects: Result['effects']) {
  for (const effect of effects) {
    if (effect.type === 'REQUEST') {
      // 由运行时发请求，再把成功或失败作为新事件送回机器
    }
  }
}
```


状态机给出下一步的计划，运行时把计划变成现实。前者好测，后者也便于替换和记录。


## 什么时候值得引入，什么时候别硬上


状态机不是所有 `useState` 的替代品。纯粹的开关、输入框文本、一次无分支的请求，都不值得先画图再写代码。


出现下面这些信号时，状态机通常开始划算：


- 某些状态组合“不可能”，却总要靠 `if` 防守。
- 一个动作是否可用取决于当前阶段，例如审批、支付、多步表单、播放器。
- 成功、失败、重试、取消之间有明确路径。
- 流程会暂停并恢复，需要保存中间位置。
- 多个角色或系统要在同一个流程里接棒。


反过来，如果只有一两个状态、迁移规则一眼能看完，直接写局部状态更省心。状态机的成本在于先建模。把一个简单按钮画成机场调度图，只是把复杂度从代码搬到图上，并没有真的消失。


## 写到最后


有限状态机是一种约束变化的方式：


- 状态描述流程现在站在哪。
- 事件描述发生了什么。
- 迁移表描述下一步是否被允许。
- `context` 承载流程附带的数据。
- 副作用由运行时执行，再把结果送回状态机。


如果只记住一件事：业务逻辑可以提出下一步想做什么，迁移表决定这件事在当前状态下是否被允许。没写进表里的边，程序就不该走。


下次再碰到 `loading`、`success`、`error` 三个布尔值互相打架，可以先停一下，问问自己：这里是不是已经有一张藏起来的状态图了？


## 参考资料


- [W3C SCXML](https://www.w3.org/TR/scxml/) —— 状态、事件、迁移与终止状态的通用状态机规范。
