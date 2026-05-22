export type WorkbenchRole = 'ops' | 'sales' | 'procurement'

export type WorkbenchNav = 'home' | 'tasks'

/** 运营今日缺货列表筛选（从履约数据总览钻取） */
export type OpsListFilter =
  | 'await_sales'
  | 'await_procurement'
  | 'ready_for_po'
  | 'completed'

export type SalesUrgency = 'must_on_time' | 'normal' | 'pending'

export type ProcurementMode = 'urgent' | 'normal' | 'pending'

export type ShortageLineStatus =
  | 'new'
  | 'await_sales'
  | 'await_procurement'
  | 'ready_for_po'
  | 'completed'
  | 'cancelled'

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
  salesUrgency: SalesUrgency
  salesNote: string
  supplierName: string
  amount: number
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
  salesUrgency: SalesUrgency
  salesNote: string
  supplierName: string
  eta: string
  amount: number
  isExpedited: boolean
  expediteFee: number
  status: ShortageLineStatus
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
  salesUrgency: SalesUrgency
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
  type: 'sync' | 'sales' | 'procurement' | 'ops' | 'system'
  content: string
  ref?: { poId?: string; sku?: string; hotel?: string }
}

export interface SupplyPlanInput {
  supplierName: string
  amount: number
}
