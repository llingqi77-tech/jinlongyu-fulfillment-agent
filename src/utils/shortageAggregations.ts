import type {
  OpsListFilter,
  ProcurementSkuGroup,
  SalesHotelGroup,
  ShortagePO,
  ShortagePOLine,
} from '../types/shortage'

export function getShortageLines(orders: ShortagePO[]): Array<ShortagePOLine & { po: ShortagePO }> {
  return orders.flatMap((po) =>
    po.lines.filter((l) => l.isShortage).map((line) => ({ ...line, po }))
  )
}

export function daysRemaining(requiredDate: string, from = new Date()): number {
  const end = new Date(requiredDate)
  const start = new Date(from.toISOString().slice(0, 10))
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/** 销售已登记（必须当期到货 / 不急）后才进入采购视野 */
export function isLineVisibleToProcurement(line: ShortagePOLine): boolean {
  return line.isShortage && line.salesUrgency !== 'pending'
}

export function lineReadyForPo(line: ShortagePOLine): boolean {
  if (line.salesUrgency === 'pending') return false
  if (!line.supplierName || !line.amount) return false
  return true
}

/** 采购视角行状态：录入方案后视为已完成，不展示运营的「可生成采购订单」 */
export function getProcurementDisplayStatus(
  line: ShortagePOLine
): 'pending_input' | 'done' {
  if (line.status === 'completed' || lineReadyForPo(line)) return 'done'
  return 'pending_input'
}

export function recomputeLineStatus(line: ShortagePOLine): ShortagePOLine {
  if (line.status === 'completed' || line.status === 'cancelled') return line
  if (lineReadyForPo(line)) return { ...line, status: 'ready_for_po' }
  if (line.salesUrgency !== 'pending' && line.procurementMode === 'pending') {
    return { ...line, status: 'await_procurement' }
  }
  if (line.salesUrgency === 'pending') return { ...line, status: 'await_sales' }
  return { ...line, status: 'new' }
}

export function groupBySku(orders: ShortagePO[]): ProcurementSkuGroup[] {
  const map = new Map<string, ProcurementSkuGroup>()

  for (const po of orders) {
    for (const line of po.lines.filter((l) => isLineVisibleToProcurement(l))) {
      let group = map.get(line.sku)
      if (!group) {
        group = {
          sku: line.sku,
          productName: line.productName,
          spec: line.spec,
          unit: line.unit,
          totalGap: 0,
          hotelCount: 0,
          lineCount: 0,
          mustOnTimeCount: 0,
          earliestRequiredDate: po.requiredDeliveryDate,
          latestRequiredDate: po.requiredDeliveryDate,
          procurementStatus: 'pending',
          hotelRows: [],
        }
        map.set(line.sku, group)
      }

      const dr = daysRemaining(po.requiredDeliveryDate)
      group.totalGap += line.gap
      group.lineCount += 1
      if (line.salesUrgency === 'must_on_time') group.mustOnTimeCount += 1
      if (po.requiredDeliveryDate < group.earliestRequiredDate) {
        group.earliestRequiredDate = po.requiredDeliveryDate
      }
      if (po.requiredDeliveryDate > group.latestRequiredDate) {
        group.latestRequiredDate = po.requiredDeliveryDate
      }

      group.hotelRows.push({
        lineId: line.id,
        poId: po.id,
        hotelName: po.customerName,
        gap: line.gap,
        unit: line.unit,
        requiredDeliveryDate: po.requiredDeliveryDate,
        daysRemaining: dr,
        salesUrgency: line.salesUrgency,
        salesNote: line.salesNote,
        supplierName: line.supplierName,
        eta: line.eta,
        amount: line.amount,
        isExpedited: line.isExpedited,
        expediteFee: line.expediteFee,
        status: line.status,
      })
    }
  }

  const groups = Array.from(map.values()).filter((g) => g.hotelRows.length > 0)
  for (const g of groups) {
    g.hotelCount = new Set(g.hotelRows.map((r) => r.hotelName)).size
    const done = g.hotelRows.every(
      (r) => r.status === 'completed' || r.status === 'ready_for_po' || !!r.supplierName
    )
    const partial = g.hotelRows.some((r) => !!r.supplierName)
    g.procurementStatus = done ? 'done' : partial ? 'partial' : 'pending'
    g.hotelRows.sort((a, b) => {
      if (a.salesUrgency === 'must_on_time' && b.salesUrgency !== 'must_on_time') return -1
      if (b.salesUrgency === 'must_on_time' && a.salesUrgency !== 'must_on_time') return 1
      return a.daysRemaining - b.daysRemaining
    })
  }

  return groups.sort((a, b) => {
    if (b.mustOnTimeCount !== a.mustOnTimeCount) return b.mustOnTimeCount - a.mustOnTimeCount
    return daysRemaining(a.earliestRequiredDate) - daysRemaining(b.earliestRequiredDate)
  })
}

/** 仅保留客户要求为「必须当期到货」的酒店子行，并重算品级汇总 */
export function filterSkuGroupMustOnTime(group: ProcurementSkuGroup): ProcurementSkuGroup | null {
  const hotelRows = group.hotelRows.filter((r) => r.salesUrgency === 'must_on_time')
  if (hotelRows.length === 0) return null

  const dates = hotelRows.map((r) => r.requiredDeliveryDate)
  return {
    ...group,
    hotelRows,
    totalGap: hotelRows.reduce((sum, r) => sum + r.gap, 0),
    lineCount: hotelRows.length,
    mustOnTimeCount: hotelRows.length,
    hotelCount: new Set(hotelRows.map((r) => r.hotelName)).size,
    earliestRequiredDate: dates.reduce((a, b) => (a < b ? a : b)),
    latestRequiredDate: dates.reduce((a, b) => (a > b ? a : b)),
  }
}

export function groupByHotel(orders: ShortagePO[]): SalesHotelGroup[] {
  const map = new Map<string, SalesHotelGroup>()

  for (const po of orders) {
    const shortageLines = po.lines.filter((l) => l.isShortage)
    if (shortageLines.length === 0) continue

    const key = po.customerName
    let group = map.get(key)
    if (!group) {
      group = {
        hotelKey: key,
        hotelName: po.customerName,
        shortageLineCount: 0,
        completedCount: 0,
        completionRate: 0,
        isComplete: false,
        nearestDeliveryDate: po.requiredDeliveryDate,
        pendingProducts: [],
        poIds: [],
        lines: [],
      }
      map.set(key, group)
    }

    if (po.requiredDeliveryDate < group.nearestDeliveryDate) {
      group.nearestDeliveryDate = po.requiredDeliveryDate
    }
    if (!group.poIds.includes(po.id)) group.poIds.push(po.id)

    for (const line of shortageLines) {
      group.shortageLineCount += 1
      if (line.status === 'completed') group.completedCount += 1
      if (line.salesUrgency === 'pending') {
        group.pendingProducts.push(line.productName)
      }
      group.lines.push({
        lineId: line.id,
        poId: po.id,
        sku: line.sku,
        productName: line.productName,
        spec: line.spec,
        gap: line.gap,
        unit: line.unit,
        quantity: line.quantity,
        requiredDeliveryDate: po.requiredDeliveryDate,
        salesUrgency: line.salesUrgency,
        salesNote: line.salesNote,
        status: line.status,
      })
    }
  }

  const groups = Array.from(map.values())
  for (const g of groups) {
    g.completionRate =
      g.shortageLineCount === 0 ? 0 : Math.round((g.completedCount / g.shortageLineCount) * 100)
    g.isComplete = g.completedCount === g.shortageLineCount && g.shortageLineCount > 0
    g.pendingProducts = [...new Set(g.pendingProducts)]
    g.lines.sort((a, b) => {
      if (a.salesUrgency === 'pending' && b.salesUrgency !== 'pending') return -1
      if (b.salesUrgency === 'pending' && a.salesUrgency !== 'pending') return 1
      return a.requiredDeliveryDate.localeCompare(b.requiredDeliveryDate)
    })
  }

  return groups.sort((a, b) => a.completionRate - b.completionRate)
}

export function lineMatchesOpsFilter(line: ShortagePOLine, filter: OpsListFilter): boolean {
  if (!line.isShortage) return false
  switch (filter) {
    case 'await_sales':
      return line.salesUrgency === 'pending'
    case 'await_procurement':
      return line.procurementMode === 'pending' && line.salesUrgency !== 'pending'
    case 'ready_for_po':
      return line.status === 'ready_for_po'
    case 'completed':
      return line.status === 'completed'
  }
}

export function poMatchesOpsFilter(po: ShortagePO, filter: OpsListFilter): boolean {
  return po.lines.some((l) => lineMatchesOpsFilter(l, filter))
}

export function getTodayStats(orders: ShortagePO[]) {
  const lines = getShortageLines(orders)
  const hotels = groupByHotel(orders)
  const skus = groupBySku(orders)
  return {
    poCount: orders.filter((o) => o.lines.some((l) => l.isShortage)).length,
    lineCount: lines.length,
    hotelCount: hotels.length,
    skuCount: skus.length,
    awaitSales: lines.filter((l) => l.salesUrgency === 'pending').length,
    awaitProcurement: lines.filter((l) => l.procurementMode === 'pending' && l.salesUrgency !== 'pending').length,
    readyForPo: lines.filter((l) => l.status === 'ready_for_po').length,
    completed: lines.filter((l) => l.status === 'completed').length,
  }
}
