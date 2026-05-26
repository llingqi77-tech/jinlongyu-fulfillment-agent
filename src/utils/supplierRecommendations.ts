import type { SupplierCandidate } from '../types/shortage'

const SUPPLIER_POOL = [
  '益海嘉里华北供应链',
  '北京粮油批发中心',
  '华东粮油加急仓',
  '中粮贸易华东区',
  '上海益海物流',
  '广州粮油集散中心',
]

function hashSku(sku: string): number {
  let h = 0
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getRecommendedSuppliers(sku: string): SupplierCandidate[] {
  const base = hashSku(sku)
  return [0, 1, 2].map((offset) => {
    const idx = (base + offset) % SUPPLIER_POOL.length
    const score = 92 - offset * 4 - (base % 5)
    return {
      id: `sup-${sku}-${offset}`,
      name: SUPPLIER_POOL[idx],
      score,
      hasStock: 'unknown' as const,
    }
  })
}
