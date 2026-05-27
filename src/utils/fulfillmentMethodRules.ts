import type { FulfillmentMethod, ShortagePO, ShortagePOLine } from '../types/shortage'

/** 直发 / 正常补货：系统算路后直接走物流，不经阶段二/三 */
export const LOGISTICS_FULFILLMENT_METHODS = ['direct_ship', 'normal_replenishment'] as const

/** 采购建议 + 销售沟通路径（延期 / 当期到货） */
export const ADVICE_AND_NOTE_METHODS = ['must_on_time', 'defer'] as const

export function isLogisticsFulfillment(method: FulfillmentMethod): boolean {
  return method === 'direct_ship' || method === 'normal_replenishment'
}

export function showsProcurementAdvice(method: FulfillmentMethod): boolean {
  if (method === 'pending') return true
  return (ADVICE_AND_NOTE_METHODS as readonly FulfillmentMethod[]).includes(method)
}

export function showsSalesNote(method: FulfillmentMethod): boolean {
  return (ADVICE_AND_NOTE_METHODS as readonly FulfillmentMethod[]).includes(method)
}

export function showsSupplierProcurement(method: FulfillmentMethod): boolean {
  return method === 'must_on_time'
}

/** 需采购在阶段二出具建议（非系统直走路流的品） */
export function lineNeedsProcurementAdvice(line: { fulfillmentMethod: FulfillmentMethod }): boolean {
  return !isLogisticsFulfillment(line.fulfillmentMethod) && showsProcurementAdvice(line.fulfillmentMethod)
}

/** @deprecated 使用 lineNeedsProcurementAdvice */
export const lineNeedsOpsAdvice = lineNeedsProcurementAdvice
export const showsOpsAdvice = showsProcurementAdvice

/** 后台算路：仅当 mock/同步显式标记在途时走正常补货（避免演示数据被误算路） */
export function resolveBackendLogisticsMethod(
  line: ShortagePOLine,
  _po: ShortagePO
): FulfillmentMethod | null {
  if (!line.isShortage || line.fulfillmentMethod !== 'pending') return null
  if (line.hasInTransitOrder) return 'normal_replenishment'
  return null
}
