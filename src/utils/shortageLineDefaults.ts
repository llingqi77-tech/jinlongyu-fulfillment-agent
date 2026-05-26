import type { FulfillmentMethod, ShortagePOLine } from '../types/shortage'
import { getRecommendedSuppliers } from './supplierRecommendations'

export function syncLegacySalesUrgency(method: FulfillmentMethod): ShortagePOLine['salesUrgency'] {
  if (method === 'pending') return 'pending'
  if (method === 'must_on_time') return 'must_on_time'
  return 'normal'
}

export function withLineDefaults(
  partial: Partial<ShortagePOLine> & Pick<ShortagePOLine, 'id' | 'sku' | 'productName'>
): ShortagePOLine {
  const method = partial.fulfillmentMethod ?? 'pending'
  const suppliers =
    partial.recommendedSuppliers ??
    (partial.isShortage !== false ? getRecommendedSuppliers(partial.sku) : [])

  const base: ShortagePOLine = {
    spec: '',
    quantity: 0,
    unitPrice: 0,
    lineAmount: 0,
    unit: '件',
    isShortage: true,
    availableStock: 0,
    gap: 0,
    opsAdvice: '',
    fulfillmentMethod: 'pending',
    salesNote: '',
    salesOutboundType: null,
    salesOutboundNo: '',
    expectedFulfillQty: 0,
    actualFulfillQty: 0,
    signoffStatus: 'pending',
    signoffAt: '',
    recommendedSuppliers: suppliers,
    selectedSupplierId: '',
    supplierName: '',
    amount: 0,
    procurementDraftNo: '',
    procurementConfirmed: false,
    salesUrgency: 'pending',
    eta: '',
    isExpedited: false,
    expediteFee: 0,
    procurementMode: 'pending',
    status: 'new',
    opsPoNumber: '',
    id: partial.id,
    sku: partial.sku,
    productName: partial.productName,
  }

  return {
    ...base,
    ...partial,
    fulfillmentMethod: method,
    salesUrgency: partial.salesUrgency ?? syncLegacySalesUrgency(method),
    recommendedSuppliers: partial.recommendedSuppliers ?? suppliers,
  }
}
