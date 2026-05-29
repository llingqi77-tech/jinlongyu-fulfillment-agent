import type { RoleTaskItem, ShortagePO, WorkbenchRole, PipelineStageKey } from '../types/shortage'
import { OA_APPROVAL_STATUS_LABEL, PIPELINE_STAGE_SHORT } from '../constants/shortageLabels'
import {
  getPipelineBottleneckStage,
  getPipelineChevronStages,
  getShortageLines,
  getStagePendingDetailItems,
  isDeliveryToday,
  STAGE_ACTION_ROLE,
} from './shortageAggregations'
import { getMobileHomeKpis, getRoleTasksSorted, ROLE_LABEL } from './mobileAgentSummary'

export type MobileQuickActionKind = 'start_first_task' | 'open_task_list' | 'chat'

export interface MobileQuickActionItem {
  id: string
  label: string
  kind: MobileQuickActionKind
  /** 点击后发送到对话的文案（kind === 'chat'） */
  message?: string
}

const SALES_QUICK_ACTIONS: MobileQuickActionItem[] = [
  { id: 'start', label: '处理第 1 项待办', kind: 'start_first_task' },
  { id: 'pending_method', label: '待确认履约', kind: 'chat', message: '有哪些客户待确认履约方式？' },
  { id: 'urgent', label: '最紧急客户', kind: 'chat', message: '哪些客户交期最紧急？' },
  { id: 'list', label: '查看任务清单', kind: 'open_task_list' },
  { id: 'shortage', label: '今日缺货概况', kind: 'chat', message: '销售侧今日缺货概况怎样？' },
]

const PROCUREMENT_QUICK_ACTIONS: MobileQuickActionItem[] = [
  { id: 'start', label: '处理第 1 项待办', kind: 'start_first_task' },
  { id: 'advice', label: '待确认建议', kind: 'chat', message: '有哪些待确认履约建议？' },
  { id: 'sourcing', label: '待寻源采购', kind: 'chat', message: '有哪些待寻源采购？' },
  { id: 'oa', label: 'OA 待审批', kind: 'chat', message: '有多少需要 OA 审批？' },
  { id: 'urgent', label: '最紧急交期', kind: 'chat', message: '采购侧哪些任务交期最紧急？' },
]

const OPS_QUICK_ACTIONS: MobileQuickActionItem[] = [
  { id: 'bottleneck', label: '全链路卡点', kind: 'chat', message: '哪个环节积压最多？' },
  { id: 'overview', label: '今日缺货大盘', kind: 'chat', message: '今天缺货大盘怎样？' },
  { id: 'notify', label: '待跟单通知', kind: 'chat', message: '有哪些需要跟单通知？' },
  { id: 'logistics', label: '物流未签收', kind: 'chat', message: '物流还未签收的有多少？' },
  { id: 'stages', label: '各环节待办', kind: 'chat', message: '各环节待办分布怎样？' },
]

export function getMobileQuickActions(role: WorkbenchRole): MobileQuickActionItem[] {
  switch (role) {
    case 'sales':
      return SALES_QUICK_ACTIONS
    case 'procurement':
      return PROCUREMENT_QUICK_ACTIONS
    case 'ops':
      return OPS_QUICK_ACTIONS
  }
}

function formatTaskLines(tasks: RoleTaskItem[], max = 3): string {
  if (tasks.length === 0) return ''
  const lines = tasks
    .slice(0, max)
    .map(
      (t, i) =>
        `${i + 1}. ${t.title}（交期 ${t.requiredDeliveryDate?.slice(5) ?? '—'}${t.gap != null && t.unit ? ` · 缺 ${t.gap}${t.unit}` : ''}）`
    )
  const rest = tasks.length - max
  return lines.join('\n') + (rest > 0 ? `\n还有 ${rest} 项未列出。` : '')
}

function todayShortageLines(orders: ShortagePO[]) {
  return getShortageLines(orders).filter((l) => isDeliveryToday(l.po.requiredDeliveryDate))
}

function stageShortLabel(key: PipelineStageKey): string {
  if (key === 'ops_create') return '任务创建'
  return PIPELINE_STAGE_SHORT[key]
}

/** 快捷问题专属回复；message 须与各角色快捷按钮文案一致 */
export function buildQuickActionReply(
  message: string,
  role: WorkbenchRole,
  orders: ShortagePO[]
): string | null {
  const tasks = getRoleTasksSorted(orders, role)
  const kpis = getMobileHomeKpis(orders, role, 'sku')
  const daily = todayShortageLines(orders)

  if (role === 'sales') {
    if (message === '有哪些客户待确认履约方式？') {
      const pending = tasks.filter((t) => t.stage === 'sales_method')
      if (pending.length === 0) {
        return '目前没有待你确认履约方式的客户，可查看任务清单或问「今日缺货概况」。'
      }
      return `共 ${pending.length} 项待确认履约方式（需与客户沟通后判定）：\n${formatTaskLines(pending)}`
    }
    if (message === '哪些客户交期最紧急？') {
      if (tasks.length === 0) return '你目前没有待办，今日销售侧任务已清空。'
      const top = tasks.slice(0, 3)
      return `按客户交期排序，最紧急的 ${top.length} 项如下：\n${formatTaskLines(top)}`
    }
    if (message === '销售侧今日缺货概况怎样？') {
      const hotels = new Set(daily.map((l) => l.po.customerName)).size
      const myPending = tasks.length
      return `今日交货口径：缺货 ${kpis.shortageLineCount} 个品、合计缺口 ${kpis.totalGap}，涉及 ${hotels} 家酒店。你需要处理的待办 ${myPending} 项，其中待确认履约方式 ${tasks.filter((t) => t.stage === 'sales_method').length} 项。`
    }
  }

  if (role === 'procurement') {
    if (message === '有哪些待确认履约建议？') {
      const pending = tasks.filter((t) => t.stage === 'procurement_advice')
      if (pending.length === 0) {
        return '目前没有待确认履约建议，测算建议均已流转销售。'
      }
      return `共 ${pending.length} 项待你确认或补充履约建议：\n${formatTaskLines(pending)}`
    }
    if (message === '有哪些待寻源采购？') {
      const pending = tasks.filter((t) => t.stage === 'procurement')
      if (pending.length === 0) {
        return '目前没有待寻源任务，当期到货类采购均已提交处理。'
      }
      return `共 ${pending.length} 项待寻源（需选供应商 / 提交 OA）：\n${formatTaskLines(pending)}`
    }
    if (message === '有多少需要 OA 审批？') {
      const oaLines = daily.filter((l) => l.oaApprovalStatus === 'pending')
      if (oaLines.length === 0) {
        const rejected = daily.filter((l) => l.oaApprovalStatus === 'rejected').length
        return rejected > 0
          ? `当前无审批中单据；有 ${rejected} 项 OA 已驳回，需重新寻源。`
          : '当前没有处于 OA 审批中的寻源单。'
      }
      const lines = oaLines
        .slice(0, 3)
        .map(
          (l, i) =>
            `${i + 1}. ${l.po.customerName} · ${l.productName}（${OA_APPROVAL_STATUS_LABEL.pending} · ${l.oaRequestNo || '单号待回传'}）`
        )
      const rest = oaLines.length - 3
      return `共 ${oaLines.length} 项 ${OA_APPROVAL_STATUS_LABEL.pending}：\n${lines.join('\n')}${rest > 0 ? `\n还有 ${rest} 项…` : ''}`
    }
    if (message === '采购侧哪些任务交期最紧急？') {
      if (tasks.length === 0) return '采购侧待办已清空。'
      return `按交期排序，最紧急的采购待办：\n${formatTaskLines(tasks.slice(0, 3))}`
    }
  }

  if (role === 'ops') {
    if (message === '哪个环节积压最多？') {
      const bottleneck = getPipelineBottleneckStage(orders)
      if (!bottleneck) {
        return '今日各业务环节暂无积压，全链路运转正常。'
      }
      const label = stageShortLabel(bottleneck.key)
      const owner = STAGE_ACTION_ROLE[bottleneck.key]
      const ownerHint = owner ? `，主要负责角色：${ROLE_LABEL[owner]}` : ''
      return `当前积压最多的是【${label}】，约 ${bottleneck.pending} 项待处理${ownerHint}。可点进度看板该环节查看明细。`
    }
    if (message === '今天缺货大盘怎样？') {
      const stages = getPipelineChevronStages(orders)
      const hotels = new Set(daily.map((l) => l.po.customerName)).size
      const pos = new Set(daily.map((l) => l.po.id)).size
      const createStage = stages.find((s) => s.key === 'ops_create')
      const fulfillStage = stages.find((s) => s.key === 'fulfillment_done')
      return (
        `今日缺货大盘：${daily.length} 行明细、${kpis.shortageLineCount} 个品（SKU），缺口合计 ${kpis.totalGap}；` +
        `覆盖 ${hotels} 家酒店、${pos} 张 PO。` +
        `任务创建 ${createStage?.progressTotal ?? 0} 项；` +
        `本周履约完成进度 ${fulfillStage?.progressPercent ?? 0}%（${fulfillStage?.progressDone ?? 0}/${fulfillStage?.progressTotal ?? 0}）。`
      )
    }
    if (message === '有哪些需要跟单通知？') {
      const notifyStages = ['procurement_advice', 'sales_method', 'procurement'] as const
      const parts: string[] = []
      for (const key of notifyStages) {
        const items = getStagePendingDetailItems(orders, key)
        if (items.length === 0) continue
        const owner = STAGE_ACTION_ROLE[key]
        parts.push(
          `【${stageShortLabel(key)}】${items.length} 项${owner ? ` → 通知${ROLE_LABEL[owner]}` : ''}`
        )
      }
      if (parts.length === 0) {
        return '销售、采购相关环节暂无积压，无需跟单通知。'
      }
      return `以下环节有待办，建议跟单：\n${parts.join('\n')}`
    }
    if (message === '物流还未签收的有多少？') {
      const pending = getStagePendingDetailItems(orders, 'fulfillment_done')
      if (pending.length === 0) {
        return '本周交货任务均已签收完成，暂无物流跟单压力。'
      }
      const lines = pending.slice(0, 3).map((t, i) => `${i + 1}. ${t.title}（${t.sub}）`)
      const rest = pending.length - 3
      return `本周还有 ${pending.length} 项物流未签收：\n${lines.join('\n')}${rest > 0 ? `\n还有 ${rest} 项…` : ''}`
    }
    if (message === '各环节待办分布怎样？') {
      const stages = getPipelineChevronStages(orders)
      const lines = stages.map((s) => {
        const pending = Math.max(0, s.progressTotal - s.progressDone)
        const label = s.key === 'ops_create' ? '任务创建' : stageShortLabel(s.key)
        return `${label}：待办 ${pending} / 共 ${s.progressTotal}`
      })
      return `今日全链路待办分布：\n${lines.join('\n')}`
    }
  }

  return null
}

export function isRoleQuickActionMessage(message: string, role: WorkbenchRole): boolean {
  return getMobileQuickActions(role).some((a) => a.kind === 'chat' && a.message === message)
}
