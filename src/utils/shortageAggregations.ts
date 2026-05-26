import type {
  PipelineStageFilter,
  PipelineStats,
  ProcurementSkuGroup,
  RoleTaskItem,
  SalesHotelGroup,
  ShortagePO,
  ShortagePOLine,
  FulfillmentKpis,
  PipelineChevronStage,
  WorkbenchRole,
} from '../types/shortage'
import { getRecommendedSuppliers } from './supplierRecommendations'

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

export function uniqueShortageSkus(lines: ShortagePOLine[]): string[] {
  return [...new Set(lines.filter((l) => l.isShortage).map((l) => l.sku))]
}

function skuStageDone(sku: string, lines: ShortagePOLine[], check: (l: ShortagePOLine) => boolean): boolean {
  const skuLines = lines.filter((l) => l.isShortage && l.sku === sku)
  return skuLines.length > 0 && skuLines.every(check)
}

function countSkusByPredicate(lines: ShortagePOLine[], predicate: (sku: string) => boolean): number {
  const skus = uniqueShortageSkus(lines)
  return skus.filter(predicate).length
}

export function isOpsAdviceDone(line: ShortagePOLine): boolean {
  return !!line.opsAdvice.trim()
}

export function isSalesMethodDone(line: ShortagePOLine): boolean {
  return line.fulfillmentMethod !== 'pending'
}

export function isProcurementSku(line: ShortagePOLine): boolean {
  return line.isShortage && line.fulfillmentMethod === 'must_on_time'
}

export function isProcurementDone(line: ShortagePOLine): boolean {
  if (!isProcurementSku(line)) return true
  return line.procurementConfirmed && !!line.supplierName && line.amount > 0
}

export function isFulfillmentDone(line: ShortagePOLine): boolean {
  return line.signoffStatus === 'signed' || line.status === 'completed'
}

export function needsLogistics(line: ShortagePOLine): boolean {
  if (!line.isShortage || line.fulfillmentMethod === 'pending') return false
  if (line.fulfillmentMethod === 'must_on_time' && !line.procurementConfirmed) return false
  return ['direct_ship', 'normal_replenishment', 'substitute', 'defer'].includes(line.fulfillmentMethod)
}

export function isLineVisibleToProcurement(line: ShortagePOLine): boolean {
  return isProcurementSku(line) && isSalesMethodDone(line) && isOpsAdviceDone(line)
}

export function lineReadyForPo(line: ShortagePOLine): boolean {
  return isProcurementDone(line) && !!line.procurementDraftNo && !line.procurementConfirmed
}

export function getProcurementDisplayStatus(line: ShortagePOLine): 'pending_input' | 'done' {
  if (isProcurementDone(line)) return 'done'
  return 'pending_input'
}

export function recomputeLineStatus(line: ShortagePOLine): ShortagePOLine {
  if (line.status === 'cancelled') return line
  if (isFulfillmentDone(line)) return { ...line, status: 'completed' }
  if (!line.isShortage) return { ...line, status: 'new' }
  if (!isOpsAdviceDone(line)) return { ...line, status: 'await_ops' }
  if (!isSalesMethodDone(line)) return { ...line, status: 'await_sales' }
  if (line.fulfillmentMethod === 'must_on_time' && !isProcurementDone(line)) {
    return { ...line, status: 'await_procurement' }
  }
  if (needsLogistics(line) && line.signoffStatus !== 'signed') {
    return { ...line, status: 'await_logistics' }
  }
  if (line.procurementDraftNo && !line.procurementConfirmed) {
    return { ...line, status: 'ready_for_po' }
  }
  return { ...line, status: 'new' }
}

export function getPipelineStats(orders: ShortagePO[]): PipelineStats {
  const lines = getShortageLines(orders)
  const allLines = lines.map((l) => l)
  const skus = uniqueShortageSkus(allLines)
  const customerCount = new Set(lines.map((l) => l.po.customerName)).size

  const opsPending = countSkusByPredicate(allLines, (sku) =>
    !skuStageDone(sku, allLines, isOpsAdviceDone)
  )
  const salesPending = countSkusByPredicate(allLines, (sku) =>
    skuStageDone(sku, allLines, isOpsAdviceDone) &&
    !skuStageDone(sku, allLines, isSalesMethodDone)
  )
  const procLines = allLines.filter(isProcurementSku)
  const procSkus = uniqueShortageSkus(procLines)
  const procPending = procSkus.filter(
    (sku) => !skuStageDone(sku, procLines, isProcurementDone)
  ).length
  const fulfillPending = countSkusByPredicate(allLines, (sku) =>
    !skuStageDone(sku, allLines, isFulfillmentDone)
  )

  const stage = (pending: number, done: number): PipelineStats['opsAdvice'] => ({
    pending,
    done,
    totalSkus: skus.length,
    customerCount,
  })

  return {
    opsAdvice: stage(opsPending, skus.length - opsPending),
    salesMethod: stage(salesPending, skus.length - salesPending),
    procurement: stage(procPending, procSkus.length - procPending),
    fulfillment: stage(fulfillPending, skus.length - fulfillPending),
  }
}

function pipelineProgress(done: number, pending: number) {
  const total = done + pending
  return {
    progressDone: done,
    progressTotal: total,
    progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
  }
}

/** 履约进度五段展示 */
export function getPipelineChevronStages(orders: ShortagePO[]): PipelineChevronStage[] {
  const lines = getShortageLines(orders)
  const allLines = lines.map((l) => l)
  const totalSku = uniqueShortageSkus(allLines).length
  const customerCount = new Set(lines.map((l) => l.po.customerName)).size

  const opsPending = countSkusByPredicate(allLines, (sku) =>
    !skuStageDone(sku, allLines, isOpsAdviceDone)
  )
  const opsDone = totalSku - opsPending

  const salesPending = countSkusByPredicate(
    allLines,
    (sku) =>
      skuStageDone(sku, allLines, isOpsAdviceDone) &&
      !skuStageDone(sku, allLines, isSalesMethodDone)
  )
  const salesDone = countSkusByPredicate(allLines, (sku) =>
    skuStageDone(sku, allLines, isSalesMethodDone)
  )

  const procLines = allLines.filter(isProcurementSku)
  const procSkus = uniqueShortageSkus(procLines)
  const procTotal = procSkus.length
  const procPending = procSkus.filter(
    (sku) => !skuStageDone(sku, procLines, isProcurementDone)
  ).length
  const procDone = procTotal - procPending

  const fulfillDone = countSkusByPredicate(allLines, (sku) =>
    skuStageDone(sku, allLines, isFulfillmentDone)
  )
  const fulfillPending = totalSku - fulfillDone

  const createProgress = pipelineProgress(totalSku, 0)
  const fulfillProgress = pipelineProgress(fulfillDone, fulfillPending)

  return [
    {
      key: 'ops_create',
      title: '履约任务创建',
      tone: 'warm',
      row1Value: totalSku,
      row1Label: '个品',
      row2Value: customerCount,
      row2Label: '个客户',
      ...createProgress,
    },
    {
      key: 'ops_advice',
      title: '运营提供缺货履约建议',
      taskPageTitle: '运营确认产品履约建议',
      tone: 'warm',
      row1Value: opsPending,
      row1Label: '个品（待完成）',
      row2Value: opsDone,
      row2Label: '个品（已完成）',
      ...pipelineProgress(opsDone, opsPending),
      actionRole: 'ops',
    },
    {
      key: 'sales_method',
      title: '销售沟通缺货履约方式',
      tone: 'green',
      row1Value: salesPending,
      row1Label: '个品（待完成）',
      row2Value: salesDone,
      row2Label: '个品（已完成）',
      ...pipelineProgress(salesDone, salesPending),
      actionRole: 'sales',
    },
    {
      key: 'procurement',
      title: '采购执行缺货寻源',
      tone: 'blue',
      row1Value: procPending,
      row1Label: '个品（待完成）',
      row2Value: procDone,
      row2Label: '个品（已完成）',
      ...pipelineProgress(procDone, procPending),
      actionRole: 'procurement',
    },
    {
      key: 'fulfillment_done',
      title: '履约任务完成',
      tone: 'warm',
      row1Value: totalSku,
      row1Label: '个品',
      row2Value: customerCount,
      row2Label: '个客户',
      ...fulfillProgress,
    },
  ]
}

export function getFulfillmentKpis(orders: ShortagePO[]): FulfillmentKpis {
  const lines = getShortageLines(orders)
  const skus = uniqueShortageSkus(lines.map((l) => l))
  return {
    expectedQty: lines.reduce((s, l) => s + l.expectedFulfillQty, 0),
    actualQty: lines.reduce((s, l) => s + l.actualFulfillQty, 0),
    totalGap: lines.reduce((s, l) => s + l.gap, 0),
    signedSkuCount: countSkusByPredicate(
      lines.map((l) => l),
      (sku) => skuStageDone(sku, lines.map((l) => l), isFulfillmentDone)
    ),
    totalSkuCount: skus.length,
  }
}

export function lineMatchesPipelineFilter(
  line: ShortagePOLine,
  filter: PipelineStageFilter
): boolean {
  if (!line.isShortage) return false
  switch (filter) {
    case 'ops_advice':
      return !isOpsAdviceDone(line)
    case 'sales_method':
      return isOpsAdviceDone(line) && !isSalesMethodDone(line)
    case 'procurement':
      return isProcurementSku(line) && !isProcurementDone(line)
    case 'fulfillment_done':
      return !isFulfillmentDone(line) && isSalesMethodDone(line) && isOpsAdviceDone(line)
  }
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
      if (line.fulfillmentMethod === 'must_on_time') group.mustOnTimeCount += 1
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
        fulfillmentMethod: line.fulfillmentMethod,
        salesNote: line.salesNote,
        supplierName: line.supplierName,
        amount: line.amount,
        status: line.status,
        procurementConfirmed: line.procurementConfirmed,
      })
    }
  }

  const groups = Array.from(map.values()).filter((g) => g.hotelRows.length > 0)
  for (const g of groups) {
    g.hotelCount = new Set(g.hotelRows.map((r) => r.hotelName)).size
    const done = g.hotelRows.every((r) => r.procurementConfirmed)
    const partial = g.hotelRows.some((r) => !!r.supplierName)
    g.procurementStatus = done ? 'done' : partial ? 'partial' : 'pending'
    g.hotelRows.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }

  return groups.sort((a, b) => b.mustOnTimeCount - a.mustOnTimeCount)
}

export function filterSkuGroupMustOnTime(group: ProcurementSkuGroup): ProcurementSkuGroup | null {
  const hotelRows = group.hotelRows.filter((r) => r.fulfillmentMethod === 'must_on_time')
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
      if (isFulfillmentDone(line)) group.completedCount += 1
      if (line.fulfillmentMethod === 'pending') {
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
        opsAdvice: line.opsAdvice,
        fulfillmentMethod: line.fulfillmentMethod,
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
      if (a.fulfillmentMethod === 'pending' && b.fulfillmentMethod !== 'pending') return -1
      if (b.fulfillmentMethod === 'pending' && a.fulfillmentMethod !== 'pending') return 1
      return a.requiredDeliveryDate.localeCompare(b.requiredDeliveryDate)
    })
  }

  return groups.sort((a, b) => a.completionRate - b.completionRate)
}

export function getTasksForRole(
  orders: ShortagePO[],
  role: WorkbenchRole,
  pipelineFilter?: PipelineStageFilter | null
): RoleTaskItem[] {
  const lines = getShortageLines(orders)
  const matchFilter = (line: ShortagePOLine) =>
    !pipelineFilter || lineMatchesPipelineFilter(line, pipelineFilter)

  if (role === 'ops') {
    return lines
      .filter((l) => !isOpsAdviceDone(l) && matchFilter(l))
      .map((l) => ({
        id: l.id,
        lineId: l.id,
        poId: l.po.id,
        sku: l.sku,
        title: `${l.po.customerName} · ${l.productName}`,
        sub: `还缺 ${l.gap}${l.unit} · 出货 ${l.po.requiredDeliveryDate}`,
        stage: 'ops_advice' as const,
      }))
  }

  if (role === 'sales') {
    return lines
      .filter((l) => isOpsAdviceDone(l) && !isSalesMethodDone(l) && matchFilter(l))
      .map((l) => ({
        id: l.id,
        lineId: l.id,
        poId: l.po.id,
        sku: l.sku,
        title: `${l.po.customerName} · ${l.productName}`,
        sub: l.opsAdvice ? `建议：${l.opsAdvice.slice(0, 40)}…` : '待确认履约方式',
        stage: 'sales_method' as const,
      }))
  }

  return lines
    .filter((l) => isLineVisibleToProcurement(l) && !isProcurementDone(l) && matchFilter(l))
    .map((l) => ({
      id: l.id,
      lineId: l.id,
      poId: l.po.id,
      sku: l.sku,
      title: `${l.productName} · ${l.po.customerName}`,
      sub: `还缺 ${l.gap}${l.unit} · 当期到货`,
      stage: 'procurement' as const,
    }))
}

export function ensureLineSuppliers(line: ShortagePOLine): ShortagePOLine {
  if (line.recommendedSuppliers.length > 0) return line
  if (line.fulfillmentMethod !== 'must_on_time') return line
  return { ...line, recommendedSuppliers: getRecommendedSuppliers(line.sku) }
}
