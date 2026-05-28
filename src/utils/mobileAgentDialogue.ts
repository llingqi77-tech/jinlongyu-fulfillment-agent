// LLM integration point: replace handleMobileUserMessage with model + tool calls.

import { useShortageStore, type ShortageState } from '../store/shortageStore'
import type { RoleTaskItem, WorkbenchRole } from '../types/shortage'
import { FULFILLMENT_METHOD_LABEL, LINE_STATUS_LABEL } from '../constants/shortageLabels'
import { generateProcurementAdvice } from './procurementAdviceGenerator'
import {
  findTaskByUserText,
  getMobileHomeKpis,
  getRoleTasksSorted,
  MOBILE_SUGGESTED_QUESTIONS,
  parseProcurementAdviceFromText,
  parseSalesFulfillmentFromText,
  parseSupplierChoiceFromText,
} from './mobileAgentSummary'
import {
  daysRemaining,
  ensureLineSuppliers,
  getShortageLines,
  isDeliveryToday,
  isFulfillmentDone,
} from './shortageAggregations'

export type DialogueResult = {
  replies: string[]
  clearActiveTask?: boolean
}

function getLineContext(store: ShortageState, lineId: string) {
  return store.orders
    .flatMap((po) => po.lines.map((l) => ({ ...l, po })))
    .find((l) => l.id === lineId)
}

function taskGuidePrompt(role: WorkbenchRole, task: RoleTaskItem): string {
  if (role === 'sales') {
    return `好的，我们来处理「${task.title}」。\n请把和客户沟通的要点发给我（可直接粘贴微信记录），我来判断履约方式。`
  }
  if (role === 'procurement' && task.stage === 'procurement_advice') {
    return `好的，请确认或补充「${task.title}」的履约建议（也可直接说「确认」或「建议当期到货」）。`
  }
  if (role === 'procurement' && task.stage === 'procurement') {
    return `好的，请为「${task.title}」选择供应商，可以说「用推荐第一家」。`
  }
  return `已选中「${task.title}」，请告诉我需要如何处理。`
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

  store.setActiveTask(task.lineId)
  store.setMobileAgentPhase('awaiting_task_input')
  return { replies: [taskGuidePrompt(role, task)] }
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
    store.completeActiveMobileTask({
      fulfillmentMethod: parsed.method,
      salesNote: parsed.note,
    })
    const remaining = getRoleTasksSorted(useShortageStore.getState().orders, role)
    const next = remaining[0]
    const nextHint = next
      ? `\n\n最紧急的下一项：${next.title}（交期 ${next.requiredDeliveryDate?.slice(5)}）。要说「先完成第 1 个」即可继续。`
      : '\n\n今日待办已全部处理完毕。'
    return {
      replies: [
        `已理解为「${parsed.label}」，并为「${task.title}」保存。该项已完成。${nextHint}`,
      ],
      clearActiveTask: true,
    }
  }

  if (role === 'procurement' && task.stage === 'procurement_advice') {
    const advice =
      parseProcurementAdviceFromText(text) ??
      generateProcurementAdvice(ctx, ctx.po).slice(0, 40)
    store.completeActiveMobileTask({ opsAdvice: advice })
    const remaining = getRoleTasksSorted(useShortageStore.getState().orders, role)
    const next = remaining[0]
    return {
      replies: [
        `履约建议已确认：「${advice}」，已流转销售。${next ? `下一项：${next.title}。` : '相关待办已清空。'}`,
      ],
      clearActiveTask: true,
    }
  }

  if (role === 'procurement' && task.stage === 'procurement') {
    const line = ensureLineSuppliers(ctx)
    const choice = parseSupplierChoiceFromText(
      text,
      line.recommendedSuppliers.map((s) => s.name)
    )
    if (!choice) {
      return {
        replies: ['请告诉我要选哪家供应商，例如「用推荐第一家」。'],
      }
    }
    store.completeActiveMobileTask({ supplierIndex: choice.index })
    const methodLabel = FULFILLMENT_METHOD_LABEL[ctx.fulfillmentMethod]
    return {
      replies: [
        `已为「${task.title}」选用供应商并提交处理（${methodLabel}）。OA/采购单流程已启动，完成后会从待办列表移除。`,
      ],
      clearActiveTask: true,
    }
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

export function sendMobileAgentMessage(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return

  const state = useShortageStore.getState()
  if (state.mobileOnboardingPhase !== 'ready') return

  const { appendMobileChat, setActiveTask, setMobileAgentPhase } = state
  appendMobileChat({ side: 'user', content: trimmed })

  const result = handleMobileUserMessage(trimmed)
  for (const reply of result.replies) {
    appendMobileChat({ side: 'agent', content: reply, stream: true })
  }
  if (result.clearActiveTask) {
    setActiveTask(null)
    setMobileAgentPhase('idle')
  }
}
