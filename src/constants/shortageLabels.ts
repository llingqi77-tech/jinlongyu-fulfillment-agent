import type {
  OpsListFilter,
  ProcurementMode,
  SalesUrgency,
  ShortageLineStatus,
} from '../types/shortage'

export const OPS_LIST_FILTER_LABEL: Record<OpsListFilter, string> = {
  await_sales: '待销售沟通',
  await_procurement: '待采购寻源',
  ready_for_po: '待生成采购订单',
  completed: '已履约',
}

export const LINE_STATUS_LABEL: Record<ShortageLineStatus, string> = {
  new: '待处理',
  await_sales: '待销售沟通',
  await_procurement: '待采购寻源',
  ready_for_po: '可生成采购订单',
  completed: '已完成',
  cancelled: '已关闭',
}

export const SALES_URGENCY_LABEL: Record<SalesUrgency, string> = {
  must_on_time: '必须当期到货',
  normal: '不急',
  pending: '待销售确认',
}

/** 销售视角沟通结论：仅待确认 / 已完成 */
export function getSalesCommunicationLabel(urgency: SalesUrgency): '待确认' | '已完成' {
  return urgency === 'pending' ? '待确认' : '已完成'
}

export const PROCUREMENT_MODE_LABEL: Record<ProcurementMode, string> = {
  urgent: '加急采购',
  normal: '正常采购',
  pending: '待寻源',
}

/** 合并「客户要求 + 履约状态」：仅待销售确认 / 待采购寻源 */
export function getFulfillmentStageLabel(line: {
  salesUrgency: SalesUrgency
}): '待销售确认' | '待采购寻源' {
  if (line.salesUrgency === 'pending') return '待销售确认'
  return '待采购寻源'
}

export const PROCUREMENT_LINE_STATUS_LABEL = {
  pending_input: '待录入方案',
  done: '已完成',
} as const
