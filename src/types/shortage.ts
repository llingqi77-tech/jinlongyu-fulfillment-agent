export type WorkbenchRole = 'ops' | 'sales' | 'procurement'

export type PipelineStageFilter =
  | 'procurement_advice'
  | 'sales_method'
  | 'procurement'
  | 'fulfillment_done'

export type PipelineStageKey = 'ops_create' | PipelineStageFilter

export type FulfillmentMethod =
  | 'pending'
  | 'direct_ship'
  | 'normal_replenishment'
  | 'defer'
  | 'must_on_time'
  | 'substitute'

export type SalesOutboundType = 'order_direct' | 'backorder' | null

export type SignoffStatus = 'pending' | 'partial' | 'signed'

export type SupplierStockStatus = 'unknown' | 'yes' | 'no'

/** @deprecated 保留兼容 mock 迁移 */
export type SalesUrgency = 'must_on_time' | 'normal' | 'pending'

export type ProcurementMode = 'urgent' | 'normal' | 'pending'

/** 当期到货（加急）寻源：供应商选定后须先走 OA 审批 */
export type OaApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected'

export type ShortageLineStatus =
  | 'new'
  | 'await_ops'
  | 'await_sales'
  | 'await_procurement'
  | 'await_logistics'
  | 'ready_for_po'
  | 'completed'
  | 'cancelled'

export interface SupplierCandidate {
  id: string
  name: string
  score: number
  hasStock: SupplierStockStatus
}

export interface ShortagePOLine {
  id: string
  sku: string
  productName: string
  spec: string
  quantity: number
  unitPrice: number
  lineAmount: number
  unit: string
  isShortage: boolean
  availableStock: number
  gap: number
  /** 采购缺货履约建议（阶段二确认后流转销售） */
  opsAdvice: string
  /** 有在途订单时后台可判为正常补货 */
  hasInTransitOrder?: boolean
  fulfillmentMethod: FulfillmentMethod
  salesNote: string
  salesOutboundType: SalesOutboundType
  salesOutboundNo: string
  expectedFulfillQty: number
  actualFulfillQty: number
  signoffStatus: SignoffStatus
  signoffAt: string
  recommendedSuppliers: SupplierCandidate[]
  selectedSupplierId: string
  supplierName: string
  amount: number
  procurementDraftNo: string
  procurementConfirmed: boolean
  /** OA 审批（must_on_time 寻源必选） */
  oaApprovalStatus: OaApprovalStatus
  oaRequestNo: string
  /** @deprecated */
  salesUrgency: SalesUrgency
  eta: string
  isExpedited: boolean
  expediteFee: number
  procurementMode: ProcurementMode
  status: ShortageLineStatus
  opsPoNumber: string
}

export interface ShortagePO {
  id: string
  customerName: string
  deliveryAddress: string
  orderDepartment: string
  specialNote: string
  requiredDeliveryDate: string
  lines: ShortagePOLine[]
}

export interface SkuHotelSubRow {
  lineId: string
  poId: string
  hotelName: string
  gap: number
  unit: string
  requiredDeliveryDate: string
  daysRemaining: number
  fulfillmentMethod: FulfillmentMethod
  salesNote: string
  supplierName: string
  amount: number
  status: ShortageLineStatus
  procurementConfirmed: boolean
}

export interface ProcurementSkuGroup {
  sku: string
  productName: string
  spec: string
  unit: string
  totalGap: number
  hotelCount: number
  lineCount: number
  mustOnTimeCount: number
  earliestRequiredDate: string
  latestRequiredDate: string
  procurementStatus: 'pending' | 'partial' | 'done'
  hotelRows: SkuHotelSubRow[]
}

export interface SalesHotelLineItem {
  lineId: string
  poId: string
  sku: string
  productName: string
  spec: string
  gap: number
  unit: string
  quantity: number
  requiredDeliveryDate: string
  opsAdvice: string
  fulfillmentMethod: FulfillmentMethod
  salesNote: string
  status: ShortageLineStatus
}

export interface SalesHotelGroup {
  hotelKey: string
  hotelName: string
  shortageLineCount: number
  completedCount: number
  completionRate: number
  isComplete: boolean
  nearestDeliveryDate: string
  pendingProducts: string[]
  poIds: string[]
  lines: SalesHotelLineItem[]
}

export interface ActivityEvent {
  id: string
  timestamp: string
  actor: string
  type: 'sync' | 'sales' | 'procurement' | 'ops' | 'system' | 'logistics'
  content: string
  ref?: { poId?: string; sku?: string; hotel?: string }
}

export interface SupplyPlanInput {
  supplierName: string
  amount: number
}

export interface PipelineStageStats {
  pending: number
  done: number
  totalSkus: number
  customerCount: number
}

export interface PipelineStats {
  procurementAdvice: PipelineStageStats
  salesMethod: PipelineStageStats
  procurement: PipelineStageStats
  fulfillment: PipelineStageStats
}

export type PipelineChevronTone = 'warm' | 'green' | 'blue'

export interface PipelineChevronStage {
  key: PipelineStageKey
  title: string
  /** 任务页副标题 */
  taskPageTitle?: string
  tone: PipelineChevronTone
  row1Value: number
  row1Label: string
  row2Value: number
  row2Label: string
  /** 已完成占比 0–100（已完成 / (待完成 + 已完成)） */
  progressPercent: number
  progressDone: number
  progressTotal: number
  /** 该阶段有角色待办时展示「进入任务执行」并切换到此角色 */
  actionRole?: WorkbenchRole
}

export interface FulfillmentKpis {
  expectedQty: number
  actualQty: number
  totalGap: number
  signedSkuCount: number
  totalSkuCount: number
}

export interface RoleTaskItem {
  id: string
  lineId: string
  poId: string
  sku: string
  title: string
  sub: string
  stage: PipelineStageKey
}

export type TaskFlowKind = 'sales_method' | 'procurement_advice' | 'procurement'

/** 覆盖大盘的全屏层：运营对话或各角色任务流 */
export type WorkbenchOverlayView = 'ops_chat' | TaskFlowKind

export interface MethodMixItem {
  method: FulfillmentMethod
  label: string
  count: number
  percent: number
}

export interface OpsCreateSummary {
  poSynced: number
  poParsed: number
  shortageLineCount: number
  skuCount: number
  hotelCount: number
  totalGapQty: number
}

export interface FulfillmentDoneSummary {
  hotelCount: number
  orderCount: number
  completedLineCount: number
  methodMix: MethodMixItem[]
}
