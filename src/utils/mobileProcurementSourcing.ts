import { useShortageStore, type ShortageState } from '../store/shortageStore'
import type {
  MobileOrderInfoDetail,
  MobileSupplierOption,
  RoleTaskItem,
  ShortagePO,
  ShortagePOLine,
  WorkbenchRole,
} from '../types/shortage'
import { OA_APPROVAL_STATUS_LABEL } from '../constants/shortageLabels'
import {
  parseCustomSupplierFromText,
  parseSupplierChoiceFromText,
} from './mobileAgentSummary'
import { getTaskLineDetails, toMobileOrderInfoDetail } from './mobileOpsTaskDetail'
import { ensureLineSuppliers } from './shortageAggregations'
import {
  appendAgentReply,
  CHAT_ACTION_SUBMIT_OA,
  CHAT_ACTION_SUBMIT_PO,
  type AgentDialogueReply,
} from './mobileChatReplies'

type LineContext = ShortagePOLine & { po: ShortagePO }

export type ProcurementSourcingDialogueResult = {
  replies: Array<string | AgentDialogueReply>
  clearActiveTask?: boolean
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

type SourcingStep = 'supplier' | 'oa' | 'oa_pending' | 'po' | 'done'

function getLineContext(store: ShortageState, lineId: string): LineContext | undefined {
  return store.orders
    .flatMap((po) => po.lines.map((l) => ({ ...l, po })))
    .find((l) => l.id === lineId)
}

export function buildSupplierOptions(line: LineContext): MobileSupplierOption[] {
  const withSuppliers = ensureLineSuppliers(line)
  const suggestedAmount = Math.round(line.gap * line.unitPrice * 0.9)
  return withSuppliers.recommendedSuppliers.map((s, i) => ({
    index: i + 1,
    name: s.name,
    hasStock: s.hasStock,
    suggestedAmount,
  }))
}

function getSourcingStep(ctx: LineContext): SourcingStep {
  if (!ctx.supplierName || ctx.amount <= 0) return 'supplier'
  if (ctx.fulfillmentMethod === 'must_on_time') {
    if (ctx.oaApprovalStatus === 'none' || ctx.oaApprovalStatus === 'rejected') return 'oa'
    if (ctx.oaApprovalStatus === 'pending') return 'oa_pending'
    if (ctx.oaApprovalStatus === 'approved' && !ctx.procurementConfirmed) return 'po'
  }
  if (!ctx.procurementConfirmed) return 'po'
  return 'done'
}

export function procurementSourcingGuide(
  taskIndex: number,
  ctx: LineContext,
  task: RoleTaskItem
): AgentDialogueReply {
  const prefix = `以上是第${taskIndex}个订单信息。`
  const step = getSourcingStep(ctx)

  if (step === 'supplier') {
    return {
      text:
        `${prefix}采购寻源需完成两步：① 明确供应商并提交 OA；② OA 通过后提交采购订单。\n` +
        `系统已推荐 3 家供应商（见上方列表），可直接点「选用」；若都没有库存，请输入新的供应商名称和金额。`,
    }
  }
  if (step === 'oa') {
    return {
      text: `供应商已选定：${ctx.supplierName} · ¥${ctx.amount.toLocaleString()}。\n寻源第 1 步：将供应商与金额推送 OA 系统。`,
      actions: [CHAT_ACTION_SUBMIT_OA],
    }
  }
  if (step === 'oa_pending') {
    return {
      text: `OA 审批处理中（单号 ${ctx.oaRequestNo || '—'}）。演示环境约 3 秒内回传，通过后可提交采购订单完成第 2 步。`,
    }
  }
  if (step === 'po') {
    return {
      text: `OA 审批已通过（单号 ${ctx.oaRequestNo}）。\n寻源第 2 步：将采购订单下发金龙鱼采购系统。`,
      actions: [CHAT_ACTION_SUBMIT_PO],
    }
  }
  return { text: `「${task.title}」寻源环节已处理完毕。` }
}

export function appendProcurementSourcingExtras(
  task: RoleTaskItem,
  taskIndex: number,
  store: ShortageState
) {
  const ctx = getLineContext(store, task.lineId)
  if (!ctx) return

  const step = getSourcingStep(ctx)
  if (step === 'supplier') {
    store.appendMobileChat({
      side: 'agent',
      kind: 'supplier_options',
      content: '',
      meta: { suppliers: buildSupplierOptions(ctx) },
    })
  }

  appendAgentReply(store, procurementSourcingGuide(taskIndex, ctx, task))
}

const oaFollowUpTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleOaApprovedChat(lineId: string) {
  const existing = oaFollowUpTimers.get(lineId)
  if (existing) clearTimeout(existing)

  const timer = window.setTimeout(() => {
    oaFollowUpTimers.delete(lineId)
    const store = useShortageStore.getState()
    if (store.activeTaskLineId !== lineId) return
    const ctx = getLineContext(store, lineId)
    if (!ctx || ctx.oaApprovalStatus !== 'approved' || ctx.procurementConfirmed) return

    appendAgentReply(store, {
      text: `OA 审批已通过（单号 ${ctx.oaRequestNo}，状态 ${OA_APPROVAL_STATUS_LABEL.approved}）。\n\n寻源第 2 步：将采购订单下发金龙鱼采购系统。`,
      actions: [CHAT_ACTION_SUBMIT_PO],
    })
  }, 3200)

  oaFollowUpTimers.set(lineId, timer)
}

function selectSupplier(
  store: ShortageState,
  lineId: string,
  name: string,
  amount: number,
  supplierId: string
): ProcurementSourcingDialogueResult {
  store.applyCustomSupplier(lineId, name, amount, supplierId)
  return {
    replies: [
      {
        text: `已选用供应商：${name} · ¥${amount.toLocaleString()}。\n寻源第 1 步：将供应商与金额推送 OA 系统。`,
        actions: [CHAT_ACTION_SUBMIT_OA],
      },
    ],
  }
}

export function handleProcurementSourcingInput(
  text: string,
  task: RoleTaskItem,
  store: ShortageState,
  buildNextTaskHint: (role: WorkbenchRole, orders: ShortagePO[]) => string | undefined
): ProcurementSourcingDialogueResult | null {
  const lineId = task.lineId
  let ctx = getLineContext(store, lineId)
  if (!ctx) return null

  const step = getSourcingStep(ctx)

  if (step === 'supplier') {
    const line = ensureLineSuppliers(ctx)
    const custom = parseCustomSupplierFromText(text)
    if (custom && custom.amount > 0) {
      return selectSupplier(store, lineId, custom.name, custom.amount, 'custom')
    }

    const choice = parseSupplierChoiceFromText(
      text,
      line.recommendedSuppliers.map((s) => s.name)
    )
    if (!choice) {
      return {
        replies: [
          '请点选上方推荐供应商的「选用」，或输入新的供应商名称和金额。',
        ],
      }
    }

    const supplier = line.recommendedSuppliers[choice.index]
    if (!supplier) {
      return { replies: ['未找到对应推荐供应商，请重新选择或手动录入。'] }
    }

    const amount = Math.round(ctx.gap * ctx.unitPrice * 0.9)
    return selectSupplier(store, lineId, supplier.name, amount, supplier.id)
  }

  if (step === 'oa') {
    if (!/提交\s*OA|OA\s*审批|发起\s*OA/.test(text)) {
      return {
        replies: [
          {
            text: `当前已选供应商 ${ctx.supplierName} · ¥${ctx.amount.toLocaleString()}。请完成寻源第 1 步。`,
            actions: [CHAT_ACTION_SUBMIT_OA],
          },
        ],
      }
    }

    store.submitOaApproval(lineId)
    ctx = getLineContext(store, lineId)!
    scheduleOaApprovedChat(lineId)

    if (ctx.fulfillmentMethod !== 'must_on_time') {
      return {
        replies: [
          {
            text: '该品项为常规补货/直发，已跳过 OA，请提交采购订单。',
            actions: [CHAT_ACTION_SUBMIT_PO],
          },
        ],
      }
    }

    return {
      replies: [
        `已提交 OA 审批，单号 ${ctx.oaRequestNo}。演示环境约 3 秒内回传审批结果。`,
      ],
    }
  }

  if (step === 'oa_pending') {
    ctx = getLineContext(store, lineId)!
    if (ctx.oaApprovalStatus === 'approved') {
      return {
        replies: [
          {
            text: `OA 审批已通过（单号 ${ctx.oaRequestNo}）。请完成寻源第 2 步。`,
            actions: [CHAT_ACTION_SUBMIT_PO],
          },
        ],
      }
    }
    if (ctx.oaApprovalStatus === 'rejected') {
      return {
        replies: [
          {
            text: `OA 审批已驳回（单号 ${ctx.oaRequestNo}）。请调整供应商后重新提交 OA 审批。`,
            actions: [CHAT_ACTION_SUBMIT_OA],
          },
        ],
      }
    }
    return {
      replies: [
        `OA 审批仍在处理中（单号 ${ctx.oaRequestNo}），请稍候。通过后我会提示你提交采购订单。`,
      ],
    }
  }

  if (step === 'po') {
    if (!/提交采购订单|生成采购订单|下发采购|确认采购/.test(text)) {
      return {
        replies: [
          {
            text: `OA 已通过（单号 ${ctx.oaRequestNo}）。请完成寻源第 2 步。`,
            actions: [CHAT_ACTION_SUBMIT_PO],
          },
        ],
      }
    }

    store.generateProcurementDraft(lineId)
    store.confirmProcurementToErp(lineId)
    ctx = getLineContext(store, lineId)!

    const taskIndex = store.mobileTaskDisplayIndex
    const orderDetails = getTaskLineDetails(store.orders, task, task.stage).map(toMobileOrderInfoDetail)

    return {
      replies: [
        `采购订单 ${ctx.opsPoNumber} 已提交金龙鱼采购系统。寻源两步均已完成：① 供应商+OA（${ctx.oaRequestNo}）② 采购订单（${ctx.opsPoNumber}）。`,
      ],
      completedOrder: {
        taskIndex,
        fulfillmentFieldLabel: '寻源结果',
        fulfillmentMethodLabel: `${ctx.supplierName} · ¥${ctx.amount.toLocaleString()}`,
        fulfillmentDetail: `OA ${ctx.oaRequestNo} · PO ${ctx.opsPoNumber}`,
        orderDetails,
        taskProgress: task.sub,
      },
      nextTaskHint: buildNextTaskHint('procurement', useShortageStore.getState().orders),
      clearActiveTask: true,
    }
  }

  return {
    replies: ['该项寻源已完成。'],
    clearActiveTask: true,
  }
}
