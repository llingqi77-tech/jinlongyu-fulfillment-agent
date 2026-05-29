import type {
  MobileOrderInfoDetail,
  PipelineStageKey,
  RoleTaskItem,
  ShortagePO,
  ShortagePOLine,
  WorkbenchRole,
} from '../types/shortage'
import {
  getShortageLines,
  isDeliveryThisWeek,
  isDeliveryToday,
  STAGE_ACTION_ROLE,
} from './shortageAggregations'
import { ROLE_LABEL } from './mobileAgentSummary'

type ShortageLineWithPo = ShortagePOLine & { po: ShortagePO }

export interface OpsTaskLineDetail {
  lineId: string
  hotelName: string
  hotelAddress: string
  productName: string
  spec: string
  unitPrice: number
  totalAmount: number
  unit: string
  gap: number
  deliveryDate: string
  remark: string
}

const NOTIFY_STAGE_KEYS = new Set<PipelineStageKey>([
  'procurement_advice',
  'sales_method',
  'procurement',
])

export function opsStageSupportsNotify(stageKey: PipelineStageKey): boolean {
  return NOTIFY_STAGE_KEYS.has(stageKey)
}

export function getTaskLineDetails(
  orders: ShortagePO[],
  task: RoleTaskItem,
  stageKey: PipelineStageKey,
  refDate = new Date()
): OpsTaskLineDetail[] {
  const allLines = getShortageLines(orders)

  if (stageKey === 'ops_create') {
    const line = allLines.find(
      (item) => item.id === task.lineId && isDeliveryToday(item.po.requiredDeliveryDate, refDate)
    )
    return line ? [toOpsTaskLineDetail(line)] : []
  }

  if (stageKey === 'fulfillment_done') {
    const line = allLines.find(
      (item) =>
        item.id === task.lineId && isDeliveryThisWeek(item.po.requiredDeliveryDate, refDate)
    )
    return line ? [toOpsTaskLineDetail(line)] : []
  }

  const line = allLines.find(
    (item) => item.id === task.lineId && isDeliveryToday(item.po.requiredDeliveryDate, refDate)
  )
  return line ? [toOpsTaskLineDetail(line)] : []
}

export const getOpsTaskLineDetails = getTaskLineDetails

export function isRoleOwnedPipelineStage(
  role: WorkbenchRole,
  stageKey: PipelineStageKey
): boolean {
  return STAGE_ACTION_ROLE[stageKey] === role
}

export function getStageViewOnlyNote(role: WorkbenchRole, stageKey: PipelineStageKey): string {
  if (isRoleOwnedPipelineStage(role, stageKey)) return ''
  if (stageKey === 'ops_create') return '该环节由系统录入，仅可查看。'
  if (stageKey === 'fulfillment_done') return '该环节由物流处理，仅可查看。'
  const owner = STAGE_ACTION_ROLE[stageKey]
  if (owner) return `该环节由${ROLE_LABEL[owner]}负责，仅可查看。`
  return '该环节仅可查看。'
}

function toOpsTaskLineDetail(line: ShortageLineWithPo): OpsTaskLineDetail {
  const remarks = [line.po.specialNote, line.salesNote].filter(Boolean)
  return {
    lineId: line.id,
    hotelName: line.po.customerName,
    hotelAddress: line.po.deliveryAddress,
    productName: line.productName,
    spec: line.spec,
    unitPrice: line.unitPrice,
    totalAmount: line.lineAmount,
    unit: line.unit,
    gap: line.gap,
    deliveryDate: line.po.requiredDeliveryDate,
    remark: remarks.length > 0 ? remarks.join('；') : '—',
  }
}

export function toMobileOrderInfoDetail(detail: OpsTaskLineDetail): MobileOrderInfoDetail {
  return {
    hotelName: detail.hotelName,
    hotelAddress: detail.hotelAddress,
    productName: detail.productName,
    spec: detail.spec,
    gap: detail.gap,
    unit: detail.unit,
    unitPrice: detail.unitPrice,
    totalAmount: detail.totalAmount,
    deliveryDate: detail.deliveryDate,
    remark: detail.remark,
  }
}

export function buildOpsNotifyMessage(
  stageKey: PipelineStageKey,
  details: OpsTaskLineDetail[]
): string | null {
  if (!opsStageSupportsNotify(stageKey) || details.length === 0) return null

  const actionRole = STAGE_ACTION_ROLE[stageKey]
  if (!actionRole) return null

  const owner = ROLE_LABEL[actionRole]
  const lines = details.map(
    (d) =>
      `${d.hotelName} · ${d.productName}（${d.spec}）缺 ${d.gap}${d.unit}，交期 ${d.deliveryDate}，地址 ${d.hotelAddress}`
  )

  if (lines.length === 1) {
    return `请通知${owner}跟进：${lines[0]}。备注：${details[0].remark}`
  }

  return `请通知${owner}跟进以下 ${lines.length} 项：\n${lines.map((line, i) => `${i + 1}. ${line}`).join('\n')}`
}
