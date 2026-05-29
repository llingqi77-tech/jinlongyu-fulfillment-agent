// LLM integration point: replace handleMobileUserMessage with model + tool calls.

import { useShortageStore, type ShortageState } from '../store/shortageStore'
import type { MobileOrderInfoDetail, RoleTaskItem, ShortagePO, WorkbenchRole } from '../types/shortage'
import { LINE_STATUS_LABEL } from '../constants/shortageLabels'
import {
  findTaskByUserText,
  getMobileHomeKpis,
  getRoleTasksSorted,
  MOBILE_SUGGESTED_QUESTIONS,
  parseProcurementAdviceFromText,
  parseSalesFulfillmentFromText,
} from './mobileAgentSummary'
import {
  getTaskLineDetails,
  toMobileOrderInfoDetail,
} from './mobileOpsTaskDetail'
import { buildQuickActionReply, isRoleQuickActionMessage } from './mobileQuickActions'
import { appendAgentReplies, type AgentDialogueReply } from './mobileChatReplies'
import {
  appendProcurementSourcingExtras,
  handleProcurementSourcingInput,
} from './mobileProcurementSourcing'
import {
  daysRemaining,
  getShortageLines,
  isDeliveryToday,
  isFulfillmentDone,
} from './shortageAggregations'

export type DialogueResult = {
  replies: Array<string | AgentDialogueReply>
  clearActiveTask?: boolean
  startTask?: RoleTaskItem
  startViaContinue?: boolean
  completedOrder?: {
    taskIndex: number
    fulfillmentMethodLabel: string
    fulfillmentFieldLabel?: string
    fulfillmentDetail?: string
    orderDetails: MobileOrderInfoDetail[]
    taskProgress?: string
  }
  nextTaskHint?: string
}

function resolveTaskDisplayIndex(
  task: RoleTaskItem,
  tasks: RoleTaskItem[],
  store: ShortageState,
  viaContinue?: boolean
): number {
  if (viaContinue) return store.mobileTaskDisplayIndex + 1
  const idx = tasks.findIndex((t) => t.lineId === task.lineId)
  return idx >= 0 ? idx + 1 : 1
}

function taskGuidePrompt(role: WorkbenchRole, task: RoleTaskItem, taskIndex: number): string {
  const prefix = `以上是第${taskIndex}个订单信息，`
  if (role === 'sales') {
    return `${prefix}请把和客户沟通的要点发给我，我来完成履约方式判断。`
  }
  if (role === 'procurement' && task.stage === 'procurement_advice') {
    return `${prefix}请提交履约建议：选择【延期】或【当期到货（加急）】，并说明原因。`
  }
  if (role === 'procurement' && task.stage === 'procurement') {
    return `${prefix}采购寻源需完成两步：明确供应商并提交 OA，审批通过后提交采购订单。`
  }
  return `${prefix}请告诉我需要如何处理「${task.title}」。`
}

function appendTaskStartMessages(
  task: RoleTaskItem,
  store: ShortageState,
  options?: { viaContinue?: boolean }
) {
  const { role, orders, appendMobileChat, setActiveTask, setMobileAgentPhase, setMobileTaskDisplayIndex } =
    store
  if (role === 'ops') return

  const tasks = getRoleTasksSorted(orders, role)
  const taskIndex = resolveTaskDisplayIndex(task, tasks, store, options?.viaContinue)
  setMobileTaskDisplayIndex(taskIndex)
  setActiveTask(task.lineId)
  setMobileAgentPhase('awaiting_task_input')

  const details = getTaskLineDetails(orders, task, task.stage).map(toMobileOrderInfoDetail)
  appendMobileChat({
    side: 'agent',
    kind: 'order_info',
    content: '',
    meta: {
      orderDetails: details,
      taskProgress: task.sub,
      taskIndex,
      orderStatus: 'active',
    },
  })

  if (role === 'procurement' && task.stage === 'procurement') {
    appendProcurementSourcingExtras(task, taskIndex, store)
    return
  }

  appendMobileChat({
    side: 'agent',
    content: taskGuidePrompt(role, task, taskIndex),
    stream: true,
  })
}

function buildNextTaskHint(role: WorkbenchRole, orders: ShortagePO[]): string | undefined {
  const remaining = getRoleTasksSorted(orders, role)
  const next = remaining[0]
  if (!next) return '今日待办已全部处理完毕。'
  const delivery = next.requiredDeliveryDate?.slice(5) ?? '—'
  return `最紧急的下一项：${next.title}（交期 ${delivery}）。请说继续。`
}

function applyDialogueResult(result: DialogueResult, store: ShortageState) {
  appendAgentReplies(store, result.replies)
  if (result.completedOrder) {
    store.appendMobileChat({
      side: 'agent',
      kind: 'order_info',
      content: '',
      meta: {
        orderDetails: result.completedOrder.orderDetails,
        taskIndex: result.completedOrder.taskIndex,
        fulfillmentMethodLabel: result.completedOrder.fulfillmentMethodLabel,
        fulfillmentFieldLabel: result.completedOrder.fulfillmentFieldLabel,
        fulfillmentDetail: result.completedOrder.fulfillmentDetail,
        orderStatus: 'completed',
        taskProgress: result.completedOrder.taskProgress,
      },
    })
  }
  if (result.nextTaskHint) {
    store.appendMobileChat({ side: 'agent', content: result.nextTaskHint, stream: true })
  }
  if (result.startTask) {
    appendTaskStartMessages(result.startTask, store, { viaContinue: result.startViaContinue })
  }
  if (result.clearActiveTask) {
    store.setActiveTask(null)
    store.setMobileAgentPhase('idle')
  }
}

function getLineContext(store: ShortageState, lineId: string) {
  return store.orders
    .flatMap((po) => po.lines.map((l) => ({ ...l, po })))
    .find((l) => l.id === lineId)
}

function answerFaq(
  text: string,
  role: WorkbenchRole,
  store: ShortageState
): string | null {
  const { orders } = store
  const kpis = getMobileHomeKpis(orders, role, 'sku')
  const tasks = getRoleTasksSorted(orders, role)
  const daily = getShortageLines(orders).filter((l) => isDeliveryToday(l.po.requiredDeliveryDate))

  if (/缺货/.test(text)) {
    return `今日缺货共 ${kpis.shortageLineCount} 个品（SKU）、${daily.length} 行明细，合计缺口 ${kpis.totalGap}。涉及 ${new Set(daily.map((l) => l.po.customerName)).size} 家酒店、${new Set(daily.map((l) => l.po.id)).size} 张 PO。`
  }

  if (/已履约|完成了多少|完成.*多少/.test(text)) {
    return `今日交货口径下，已完成履约 ${kpis.fulfilledCount} 个品（SKU）；全链路签收完成以物流回传为准。`
  }

  if (/待办|还有多少任务/.test(text)) {
    if (tasks.length === 0) return '当前没有待你处理的任务，可以在对话中随时提问。'
    const byStage = tasks.reduce<Record<string, number>>((acc, t) => {
      const key = t.stageLabel ?? t.stage
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    const detail = Object.entries(byStage)
      .map(([k, v]) => `${k} ${v} 项`)
      .join('、')
    return `你还有 ${tasks.length} 项待办：${detail}。`
  }

  if (/紧急|最急/.test(text)) {
    if (tasks.length === 0) return '目前没有待办任务。'
    const top = tasks.slice(0, 3)
    const lines = top
      .map(
        (t, i) =>
          `${i + 1}. ${t.title}（交期 ${t.requiredDeliveryDate?.slice(5) ?? '—'}）`
      )
      .join('\n')
    return `最紧急的待办如下（按交期排序）：\n${lines}`
  }

  if (/卡.*节点|哪个节点|环节/.test(text)) {
    const active = store.activeTaskLineId
      ? tasks.find((t) => t.lineId === store.activeTaskLineId)
      : null
    if (active) {
      const ctx = getLineContext(store, active.lineId)
      const status = ctx ? LINE_STATUS_LABEL[ctx.status] : active.stageLabel
      return `「${active.title}」当前在【${active.stageLabel}】，系统状态：${status}。`
    }
    const byStage = tasks.reduce<Record<string, number>>((acc, t) => {
      const key = t.stageLabel ?? t.stage
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    if (Object.keys(byStage).length === 0) {
      return '各环节暂无积压待办。'
    }
    const detail = Object.entries(byStage)
      .map(([k, v]) => `${k}：${v} 项`)
      .join('；')
    return `待办按环节分布：${detail}。`
  }

  if (/香格里拉|调和油/.test(text)) {
    const hit =
      findTaskByUserText(tasks, text) ??
      tasks.find((t) => t.title.includes('香格里拉') || t.title.includes('调和油'))
    if (!hit) {
      const line = getShortageLines(orders).find(
        (l) => l.po.customerName.includes('香格里拉') && l.productName.includes('调和油')
      )
      if (line) {
        const days = daysRemaining(line.po.requiredDeliveryDate)
        const done = isFulfillmentDone(line)
        return `北京香格里拉饭店 · ${line.productName}：缺 ${line.gap}${line.unit}，交期 ${line.po.requiredDeliveryDate.slice(5)}（${days} 天），${done ? '已履约完成' : `状态 ${LINE_STATUS_LABEL[line.status]}`}。`
      }
      return '未找到匹配的香格里拉调和油任务，你可以说「查看第 1 个任务」进入详情。'
    }
    const ctx = getLineContext(store, hit.lineId)
    const days = hit.requiredDeliveryDate ? daysRemaining(hit.requiredDeliveryDate) : '—'
    return `「${hit.title}」：缺 ${hit.gap}${hit.unit}，交期还剩 ${days} 天，当前环节【${hit.stageLabel}】${ctx ? `，${LINE_STATUS_LABEL[ctx.status]}` : ''}。`
  }

  return null
}

function tryContinueNext(
  text: string,
  role: WorkbenchRole,
  store: ShortageState
): DialogueResult | null {
  if (role === 'ops') return null
  if (!/^(继续|继续处理|下一项|下一个)$/.test(text.trim())) return null

  if (store.mobileAgentPhase === 'awaiting_task_input') {
    return { replies: ['请先完成当前订单的处理，再说「继续」。'] }
  }

  const tasks = getRoleTasksSorted(store.orders, role)
  if (tasks.length === 0) {
    return { replies: ['今日待办已全部处理完毕。'] }
  }

  return { startTask: tasks[0], startViaContinue: true, replies: [] }
}

function trySelectTask(
  text: string,
  role: WorkbenchRole,
  store: ShortageState
): DialogueResult | null {
  const tasks = getRoleTasksSorted(store.orders, role)
  if (tasks.length === 0) return null

  const wantsTask =
    /第\s*\d+\s*个|先完成|想.*完成|查看|处理|帮我/.test(text) ||
    findTaskByUserText(tasks, text) !== null

  if (!wantsTask) return null

  const task = findTaskByUserText(tasks, text) ?? tasks[0]
  if (!task) return null

  if (role === 'ops') {
    const ctx = getLineContext(store, task.lineId)
    const status = ctx ? LINE_STATUS_LABEL[ctx.status] : task.stageLabel
    return {
      replies: [
        `「${task.title}」目前在【${task.stageLabel}】（${status}）。运营侧请通过对话查询；写操作请切换销售/采购角色演示。`,
      ],
    }
  }

  return { startTask: task, replies: [] }
}

function handleTaskInput(
  text: string,
  role: WorkbenchRole,
  store: ShortageState
): DialogueResult | null {
  const lineId = store.activeTaskLineId
  if (!lineId || store.mobileAgentPhase !== 'awaiting_task_input') return null

  const task = getRoleTasksSorted(store.orders, role).find((t) => t.lineId === lineId)
  const ctx = getLineContext(store, lineId)
  if (!task || !ctx) {
    return {
      replies: ['任务已不存在或已完成，请选择其他任务。'],
      clearActiveTask: true,
    }
  }

  if (role === 'sales') {
    const parsed = parseSalesFulfillmentFromText(text)
    if (!parsed) {
      return {
        replies: [
          '没能从描述中判断履约方式。请说明客户是否接受延期、当期到货，或粘贴更完整的微信沟通记录。',
        ],
      }
    }
    const taskIndex = store.mobileTaskDisplayIndex
    const orderDetails = getTaskLineDetails(store.orders, task, task.stage).map(toMobileOrderInfoDetail)
    store.completeActiveMobileTask({
      fulfillmentMethod: parsed.method,
      salesNote: parsed.note,
    })
    return {
      replies: [`已理解为「${parsed.label}」，并为「${task.title}」保存。该项已完成。`],
      completedOrder: {
        taskIndex,
        fulfillmentMethodLabel: parsed.label,
        orderDetails,
        taskProgress: task.sub,
      },
      nextTaskHint: buildNextTaskHint(role, useShortageStore.getState().orders),
      clearActiveTask: true,
    }
  }

  if (role === 'procurement' && task.stage === 'procurement_advice') {
    const parsed = parseProcurementAdviceFromText(text)
    if (!parsed) {
      return {
        replies: [
          '请提交履约建议：选择【延期】或【当期到货（加急）】，并说明原因。例如：「延期，到仓+物流预计晚于交期，需销售与客户协商新交期」或「当期到货（加急），婚宴活动用油交期不可拖」。',
        ],
      }
    }
    const taskIndex = store.mobileTaskDisplayIndex
    const orderDetails = getTaskLineDetails(store.orders, task, task.stage).map(toMobileOrderInfoDetail)
    store.completeActiveMobileTask({ opsAdvice: parsed.advice })
    return {
      replies: [`履约建议已提交：【${parsed.label}】。该项已完成，已流转销售沟通。`],
      completedOrder: {
        taskIndex,
        fulfillmentFieldLabel: '履约建议',
        fulfillmentMethodLabel: parsed.label,
        fulfillmentDetail: parsed.reason,
        orderDetails,
        taskProgress: task.sub,
      },
      nextTaskHint: buildNextTaskHint(role, useShortageStore.getState().orders),
      clearActiveTask: true,
    }
  }

  if (role === 'procurement' && task.stage === 'procurement') {
    return handleProcurementSourcingInput(text, task, store, buildNextTaskHint)
  }

  return null
}

export function handleMobileUserMessage(text: string): DialogueResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { replies: ['请输入内容或点选下方快捷问题。'] }
  }

  const store = useShortageStore.getState()
  const { role } = store

  const taskInput = handleTaskInput(trimmed, role, store)
  if (taskInput) return taskInput

  const continueNext = tryContinueNext(trimmed, role, store)
  if (continueNext) return continueNext

  if (isRoleQuickActionMessage(trimmed, role)) {
    const quickReply = buildQuickActionReply(trimmed, role, store.orders)
    if (quickReply) return { replies: [quickReply] }
  }

  const faq = answerFaq(trimmed, role, store)
  if (faq) return { replies: [faq] }

  const select = trySelectTask(trimmed, role, store)
  if (select) return select

  const tasks = getRoleTasksSorted(store.orders, role)
  if (tasks.length > 0) {
    return {
      replies: [
        `我可以帮你处理待办或回答问题。例如说：「先完成第 1 个任务」，或点击：${MOBILE_SUGGESTED_QUESTIONS[0]}`,
      ],
    }
  }

  return {
    replies: [
      '今日待办已处理完毕。你可以继续问缺货数据、履约进度等问题。',
    ],
  }
}

export function buildTaskSelectMessage(index: number): string {
  return `我想先完成第 ${index} 个任务`
}

export function startMobileTaskInChat(task: RoleTaskItem) {
  const state = useShortageStore.getState()
  if (state.mobileOnboardingPhase !== 'ready' || state.role === 'ops') return
  applyDialogueResult({ startTask: task, replies: [] }, state)
}

export function startMobileTaskByIndex(index: number) {
  const state = useShortageStore.getState()
  const tasks = getRoleTasksSorted(state.orders, state.role)
  const task = tasks[index - 1]
  if (task) startMobileTaskInChat(task)
}

export function pickRecommendedSupplier(supplierIndex: number) {
  const ordinals = ['一', '二', '三']
  const ordinal = ordinals[supplierIndex - 1] ?? String(supplierIndex)
  sendMobileAgentMessage(`用推荐第${ordinal}家`)
}

export function sendMobileAgentMessage(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return

  const state = useShortageStore.getState()
  if (state.mobileOnboardingPhase !== 'ready') return

  state.appendMobileChat({ side: 'user', content: trimmed })

  const result = handleMobileUserMessage(trimmed)
  applyDialogueResult(result, state)
}
