import type {
  FulfillmentMethod,
  OaApprovalStatus,
  PipelineStageFilter,
  ProcurementMode,
  SalesOutboundType,
  ShortageLineStatus,
} from '../types/shortage'

export const PIPELINE_STAGE_LABEL: Record<PipelineStageFilter, string> = {
  procurement_advice: '采购提供缺货履约建议',
  sales_method: '销售沟通缺货履约方式',
  procurement: '采购执行缺货寻源',
  fulfillment_done: '完成履约任务',
}

/** Pipeline 卡片短标题（UI 展示） */
export const PIPELINE_STAGE_SHORT: Record<PipelineStageFilter, string> = {
  procurement_advice: '采购履约建议',
  sales_method: '销售沟通',
  procurement: '采购寻源',
  fulfillment_done: '履约完成',
}

/** Pipeline 卡片副标题 */
export const PIPELINE_STAGE_DESC: Record<PipelineStageFilter, string> = {
  procurement_advice: '测算到仓+物流，确认建议并流转销售',
  sales_method: '客户选择延期或当期到货',
  procurement: '当期到货紧急寻源',
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

/** 履约完成分布图：四种完成方式固定色 */
export const FULFILLMENT_DONE_METHOD_CHART_COLOR: Record<
  'direct_ship' | 'normal_replenishment' | 'defer' | 'must_on_time',
  string
> = {
  direct_ship: '#ff4d00',
  normal_replenishment: '#2563eb',
  defer: '#7c3aed',
  must_on_time: '#d97706',
}

/** 销售沟通可选项（直发/正常补货由系统算路，不在此选择） */
export const SALES_SELECTABLE_METHODS = ['defer', 'must_on_time'] as const satisfies readonly FulfillmentMethod[]

export const SALES_OUTBOUND_LABEL: Record<NonNullable<SalesOutboundType>, string> = {
  order_direct: '销售出库订单 OrderDirect',
  backorder: 'Backorder 销售出库订单',
}

export const LINE_STATUS_LABEL: Record<ShortageLineStatus, string> = {
  new: '待处理',
  await_ops: '待采购建议',
  await_sales: '待销售确认',
  await_procurement: '待采购寻源',
  await_logistics: '待客户签收',
  ready_for_po: '可生成采购订单',
  completed: '已完成',
  cancelled: '已关闭',
}

export const OA_APPROVAL_STATUS_LABEL: Record<OaApprovalStatus, string> = {
  none: '未提交',
  pending: 'OA 审批中',
  approved: 'OA 已通过',
  rejected: 'OA 已驳回',
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
  if (line.fulfillmentMethod === 'direct_ship' || line.fulfillmentMethod === 'normal_replenishment') {
    return FULFILLMENT_METHOD_LABEL[line.fulfillmentMethod]
  }
  if (!line.opsAdvice.trim()) return '待采购建议'
  if (line.fulfillmentMethod === 'pending') return '待销售确认'
  if (line.fulfillmentMethod === 'must_on_time' && !line.procurementConfirmed) return '待采购寻源'
  return '履约进行中'
}
