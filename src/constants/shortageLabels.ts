import type {
  FulfillmentMethod,
  PipelineStageFilter,
  ProcurementMode,
  SalesOutboundType,
  ShortageLineStatus,
} from '../types/shortage'

export const PIPELINE_STAGE_LABEL: Record<PipelineStageFilter, string> = {
  ops_advice: '运营创建待履约任务并提供履约建议',
  sales_method: '销售确认产品履约方式',
  procurement: '采购进行缺货产品采买',
  fulfillment_done: '完成履约任务',
}

/** Pipeline 卡片短标题（UI 展示） */
export const PIPELINE_STAGE_SHORT: Record<PipelineStageFilter, string> = {
  ops_advice: '运营缺货建议',
  sales_method: '销售沟通',
  procurement: '采购寻源',
  fulfillment_done: '履约完成',
}

/** Pipeline 卡片副标题 */
export const PIPELINE_STAGE_DESC: Record<PipelineStageFilter, string> = {
  ops_advice: '创建待履约任务并给出建议',
  sales_method: '确认产品履约方式',
  procurement: '完成缺货产品采买',
  fulfillment_done: '签收与任务闭环',
}

export const FULFILLMENT_METHOD_LABEL: Record<FulfillmentMethod, string> = {
  pending: '待确认',
  direct_ship: '直发',
  normal_replenishment: '正常补货',
  defer: '延期',
  must_on_time: '当期到货（加急）',
  substitute: '产品平替',
}

/** 销售工作台可选项（直发/正常补货由后台签收数据驱动，不在此选择） */
export const SALES_SELECTABLE_METHODS = [
  'must_on_time',
  'defer',
  'substitute',
] as const satisfies readonly FulfillmentMethod[]

export const SALES_OUTBOUND_LABEL: Record<NonNullable<SalesOutboundType>, string> = {
  order_direct: '销售出库订单 OrderDirect',
  backorder: 'Backorder 销售出库订单',
}

export const LINE_STATUS_LABEL: Record<ShortageLineStatus, string> = {
  new: '待处理',
  await_ops: '待运营处理',
  await_sales: '待销售确认',
  await_procurement: '待采购寻源',
  await_logistics: '待客户签收',
  ready_for_po: '可生成采购订单',
  completed: '已完成',
  cancelled: '已关闭',
}

export const PROCUREMENT_MODE_LABEL: Record<ProcurementMode, string> = {
  urgent: '加急采购',
  normal: '正常采购',
  pending: '待寻源',
}

export const PROCUREMENT_LINE_STATUS_LABEL = {
  pending_input: '待录入方案',
  done: '已完成',
} as const

/** 销售沟通：待确认 / 已完成 */
export function getSalesCommunicationLabel(
  method: FulfillmentMethod
): '待确认' | '已完成' {
  return method === 'pending' ? '待确认' : '已完成'
}

export function getFulfillmentStageLabel(line: {
  fulfillmentMethod: FulfillmentMethod
  opsAdvice: string
  procurementConfirmed?: boolean
}): string {
  if (!line.opsAdvice.trim()) return '待运营建议'
  if (line.fulfillmentMethod === 'pending') return '待销售确认'
  if (line.fulfillmentMethod === 'must_on_time' && !line.procurementConfirmed) return '待采购寻源'
  return '履约进行中'
}
