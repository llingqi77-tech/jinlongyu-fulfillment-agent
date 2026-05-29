import type {
  FulfillmentDoneSummary,
  FulfillmentMethod,
  OpsCreateSummary,
  PipelineStageFilter,
  PipelineStats,
  PipelineStageStats,
  ProcurementSkuGroup,
  RoleTaskItem,
  SalesHotelGroup,
  ShortagePO,
  ShortagePOLine,
  FulfillmentKpis,
  PipelineChevronStage,
  PipelineStageKey,
  TaskFlowKind,
  WorkbenchRole,
} from '../types/shortage'
import { FULFILLMENT_METHOD_LABEL } from '../constants/shortageLabels'
import {
  isLogisticsFulfillment,
  lineNeedsProcurementAdvice,
  resolveBackendLogisticsMethod,
} from './fulfillmentMethodRules'
import { getRecommendedSuppliers } from './supplierRecommendations'

export function getShortageLines(orders: ShortagePO[]): Array<ShortagePOLine & { po: ShortagePO }> {
  return orders.flatMap((po) =>
    po.lines.filter((l) => l.isShortage).map((line) => ({ ...line, po }))
  )
}

/** 本地日历日 YYYY-MM-DD（避免 toISOString UTC 导致「今日」过滤错位） */
export function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addCalendarDays(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  d.setDate(d.getDate() + days)
  return localDateKey(d)
}

export function daysRemaining(requiredDate: string, from = new Date()): number {
  const [y, m, day] = requiredDate.slice(0, 10).split('-').map(Number)
  const end = new Date(y, m - 1, day)
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function toDateKey(date: Date | string): string {
  if (typeof date === 'string') return date.slice(0, 10)
  return localDateKey(date)
}

/** 交货日为当天（当日需完成任务口径） */
export function isDeliveryToday(requiredDate: string, ref = new Date()): boolean {
  return toDateKey(requiredDate) === toDateKey(ref)
}

export function getWeekRange(ref = new Date()): { start: string; end: string } {
  const anchor = new Date(ref)
  anchor.setHours(0, 0, 0, 0)
  const day = anchor.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const weekStart = new Date(anchor)
  weekStart.setDate(anchor.getDate() + mondayOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return { start: toDateKey(weekStart), end: toDateKey(weekEnd) }
}

/** 交货日落在本周一至周日 */
export function isDeliveryThisWeek(requiredDate: string, ref = new Date()): boolean {
  const key = toDateKey(requiredDate)
  const { start, end } = getWeekRange(ref)
  return key >= start && key <= end
}

export function formatWeekRangeLabel(ref = new Date()): string {
  const { start, end } = getWeekRange(ref)
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}/${Number(d)}`
  }
  return `${fmt(start)}–${fmt(end)}`
}

type ShortageLineWithPo = ShortagePOLine & { po: ShortagePO }

function filterDailyLines(lines: ShortageLineWithPo[], ref = new Date()): ShortageLineWithPo[] {
  return lines.filter((l) => isDeliveryToday(l.po.requiredDeliveryDate, ref))
}

function filterWeeklyLines(lines: ShortageLineWithPo[], ref = new Date()): ShortageLineWithPo[] {
  return lines.filter((l) => isDeliveryThisWeek(l.po.requiredDeliveryDate, ref))
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

export function isProcurementAdviceDone(line: ShortagePOLine): boolean {
  if (isLogisticsFulfillment(line.fulfillmentMethod)) return true
  if (!lineNeedsProcurementAdvice(line)) return true
  return !!line.opsAdvice.trim()
}

/** @deprecated 使用 isProcurementAdviceDone */
export const isOpsAdviceDone = isProcurementAdviceDone

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

export type ProcurementSourcingSubstep = 'supplier' | 'po'

/** 采购寻源待办子步骤：待确定供应商 / 已提交 OA 待提交采购订单 */
export function classifyProcurementSourcingSubstep(
  line: ShortagePOLine
): ProcurementSourcingSubstep | null {
  if (!isProcurementSku(line) || isProcurementDone(line)) return null
  if (
    !line.supplierName ||
    line.amount <= 0 ||
    line.oaApprovalStatus === 'none' ||
    line.oaApprovalStatus === 'rejected'
  ) {
    return 'supplier'
  }
  if (!line.procurementConfirmed) return 'po'
  return null
}

export function getProcurementSourcingBreakdown(orders: ShortagePO[], refDate = new Date()) {
  const scoped = filterDailyLines(getShortageLines(orders), refDate).filter((l) =>
    lineMatchesPipelineFilter(l, 'procurement')
  )
  let supplierPending = 0
  let poPending = 0
  for (const line of scoped) {
    const sub = classifyProcurementSourcingSubstep(line)
    if (sub === 'supplier') supplierPending++
    else if (sub === 'po') poPending++
  }
  return { supplierPending, poPending, total: supplierPending + poPending }
}

export function isFulfillmentDone(line: ShortagePOLine): boolean {
  return line.signoffStatus === 'signed' || line.status === 'completed'
}

export function needsLogistics(line: ShortagePOLine): boolean {
  if (!line.isShortage || line.fulfillmentMethod === 'pending') return false
  if (line.fulfillmentMethod === 'must_on_time' && !line.procurementConfirmed) return false
  return ['direct_ship', 'normal_replenishment', 'defer'].includes(line.fulfillmentMethod)
}

export function isLineVisibleToProcurement(line: ShortagePOLine): boolean {
  return isProcurementSku(line) && isSalesMethodDone(line) && isProcurementAdviceDone(line)
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
  if (!isProcurementAdviceDone(line)) return { ...line, status: 'await_ops' }
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

  const adviceScope = allLines.filter(lineNeedsProcurementAdvice)
  const adviceSkus = uniqueShortageSkus(adviceScope)
  const procAdvicePending = countSkusByPredicate(adviceScope, (sku) =>
    !skuStageDone(sku, adviceScope, isProcurementAdviceDone)
  )
  const salesScope = allLines.filter(
    (l) => lineNeedsProcurementAdvice(l) && isProcurementAdviceDone(l)
  )
  const salesPending = countSkusByPredicate(
    salesScope,
    (sku) => !skuStageDone(sku, salesScope, isSalesMethodDone)
  )
  const procLines = allLines.filter(isProcurementSku)
  const procSkus = uniqueShortageSkus(procLines)
  const procPending = procSkus.filter(
    (sku) => !skuStageDone(sku, procLines, isProcurementDone)
  ).length
  const fulfillPending = countSkusByPredicate(allLines, (sku) =>
    !skuStageDone(sku, allLines, isFulfillmentDone)
  )

  const stage = (pending: number, done: number, total: number): PipelineStageStats => ({
    pending,
    done,
    totalSkus: total,
    customerCount,
  })

  return {
    procurementAdvice: stage(procAdvicePending, adviceSkus.length - procAdvicePending, adviceSkus.length),
    salesMethod: stage(
      salesPending,
      uniqueShortageSkus(salesScope).length - salesPending,
      uniqueShortageSkus(salesScope).length
    ),
    procurement: stage(procPending, procSkus.length - procPending, procSkus.length),
    fulfillment: stage(fulfillPending, skus.length - fulfillPending, skus.length),
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

/** 履约进度五段展示（前四段按当日交货任务统计，履约完成按本周统计） */
export function getPipelineChevronStages(
  orders: ShortagePO[],
  refDate = new Date()
): PipelineChevronStage[] {
  const allLines = getShortageLines(orders)
  const dailyLines = filterDailyLines(allLines, refDate)
  const weeklyLines = filterWeeklyLines(allLines, refDate)

  const dailyTaskCount = dailyLines.length
  const dailyHotelCount = new Set(dailyLines.map((l) => l.po.customerName)).size

  const adviceLines = dailyLines.filter(lineNeedsProcurementAdvice)
  const adviceSkuCount = uniqueShortageSkus(adviceLines).length
  const procAdvicePending = countSkusByPredicate(adviceLines, (sku) =>
    !skuStageDone(sku, adviceLines, isProcurementAdviceDone)
  )
  const procAdviceDone = adviceSkuCount - procAdvicePending

  const salesLines = dailyLines.filter(
    (l) => lineNeedsProcurementAdvice(l) && isProcurementAdviceDone(l)
  )
  const salesSkuCount = uniqueShortageSkus(salesLines).length
  const salesPending = countSkusByPredicate(
    salesLines,
    (sku) => !skuStageDone(sku, salesLines, isSalesMethodDone)
  )
  const salesDone = salesSkuCount - salesPending

  const procLines = dailyLines.filter(isProcurementSku)
  const procSkus = uniqueShortageSkus(procLines)
  const procTotal = procSkus.length
  const procPending = procSkus.filter(
    (sku) => !skuStageDone(sku, procLines, isProcurementDone)
  ).length
  const procDone = procTotal - procPending

  const weeklySkuCount = uniqueShortageSkus(weeklyLines).length
  const weeklyHotelCount = new Set(weeklyLines.map((l) => l.po.customerName)).size
  const fulfillDone = countSkusByPredicate(weeklyLines, (sku) =>
    skuStageDone(sku, weeklyLines, isFulfillmentDone)
  )
  const fulfillPending = weeklySkuCount - fulfillDone

  const createProgress = pipelineProgress(dailyTaskCount, 0)

  return [
    {
      key: 'ops_create',
      title: '履约任务创建',
      tone: 'warm',
      row1Value: dailyTaskCount,
      row1Label: '个待履约任务',
      row2Value: dailyHotelCount,
      row2Label: '个酒店',
      ...createProgress,
    },
    {
      key: 'procurement_advice',
      title: '采购提供缺货履约建议',
      taskPageTitle: '采购确认缺货履约建议',
      tone: 'warm',
      row1Value: procAdvicePending,
      row1Label: '个品（待完成）',
      row2Value: procAdviceDone,
      row2Label: '个品（已完成）',
      ...pipelineProgress(procAdviceDone, procAdvicePending),
      actionRole: 'procurement',
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
      row1Value: weeklySkuCount,
      row1Label: '个品',
      row2Value: weeklyHotelCount,
      row2Label: '个酒店',
      ...pipelineProgress(fulfillDone, fulfillPending),
    },
  ]
}

export function getStagePendingCount(
  orders: ShortagePO[],
  stageKey: PipelineStageKey,
  refDate = new Date()
): number {
  const stage = getPipelineChevronStages(orders, refDate).find((s) => s.key === stageKey)
  if (!stage) return 0
  if (stageKey === 'ops_create') return stage.row1Value
  return Math.max(0, stage.progressTotal - stage.progressDone)
}

export function getPipelineBottleneckStage(
  orders: ShortagePO[],
  refDate = new Date()
): { key: PipelineStageKey; pending: number } | null {
  const stages = getPipelineChevronStages(orders, refDate)
  let best: PipelineChevronStage | null = null
  let maxPending = 0

  for (const stage of stages) {
    if (stage.key === 'ops_create') continue
    const pending = Math.max(0, stage.progressTotal - stage.progressDone)
    if (pending > maxPending) {
      maxPending = pending
      best = stage
    }
  }

  if (!best || maxPending === 0) return null
  return { key: best.key, pending: maxPending }
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

export const STAGE_ACTION_ROLE: Record<PipelineStageKey, WorkbenchRole | undefined> = {
  ops_create: undefined,
  procurement_advice: 'procurement',
  sales_method: 'sales',
  procurement: 'procurement',
  fulfillment_done: undefined,
}

function lineInStageDetail(line: ShortagePOLine, stageKey: PipelineStageKey): boolean {
  if (!line.isShortage) return false
  switch (stageKey) {
    case 'ops_create':
      return true
    case 'procurement_advice':
      return lineNeedsProcurementAdvice(line)
    case 'sales_method':
      return lineNeedsProcurementAdvice(line) && isProcurementAdviceDone(line)
    case 'procurement':
      return isLineVisibleToProcurement(line)
    case 'fulfillment_done':
      return isSalesMethodDone(line) || isLogisticsFulfillment(line.fulfillmentMethod)
  }
}

function stageDetailSub(
  line: ShortagePOLine & { po: ShortagePO },
  stageKey: PipelineStageKey
): string {
  const base = `还缺 ${line.gap}${line.unit} · 交货 ${line.po.requiredDeliveryDate}`
  switch (stageKey) {
    case 'ops_create':
      return `${line.po.id} · ${base}`
    case 'procurement_advice':
      return isProcurementAdviceDone(line)
        ? `建议：${line.opsAdvice}`
        : `待到仓+物流测算并确认建议 · ${base}`
    case 'sales_method':
      return line.fulfillmentMethod === 'pending'
        ? `待确认履约方式 · ${base}`
        : `已确认 · ${FULFILLMENT_METHOD_LABEL[line.fulfillmentMethod]}`
    case 'procurement':
      if (isProcurementDone(line)) {
        return `已寻源 · ${line.supplierName} · PO ${line.opsPoNumber || line.procurementDraftNo}`
      }
      if (classifyProcurementSourcingSubstep(line) === 'supplier') {
        return `①待确定供应商 · ${base}`
      }
      if (line.oaApprovalStatus === 'pending') {
        return `②OA审批中 · ${base}`
      }
      return `②待提交采购订单 · ${base}`
    case 'fulfillment_done':
      return isFulfillmentDone(line) ? '已签收完成' : `履约中 · ${base}`
  }
}

export function getStageDetailItems(
  orders: ShortagePO[],
  stageKey: PipelineStageKey,
  refDate = new Date()
): RoleTaskItem[] {
  if (stageKey === 'ops_create') {
    return getOpsCreateTaskItems(orders, refDate)
  }

  const allLines = getShortageLines(orders)
  const scoped =
    stageKey === 'fulfillment_done'
      ? filterWeeklyLines(allLines, refDate)
      : filterDailyLines(allLines, refDate)

  return scoped
    .filter((l) => lineInStageDetail(l, stageKey))
    .map((l) => ({
      id: l.id,
      lineId: l.id,
      poId: l.po.id,
      sku: l.sku,
      title: `${l.po.customerName} · ${l.productName}`,
      sub: stageDetailSub(l, stageKey),
      stage: stageKey,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
}

/** 任务创建阶段按酒店+品项划分（每条缺货行一项待履约任务） */
export function getOpsCreateTaskItems(
  orders: ShortagePO[],
  refDate = new Date()
): RoleTaskItem[] {
  const dailyLines = filterDailyLines(getShortageLines(orders), refDate)

  return dailyLines
    .map((l) => ({
      id: l.id,
      lineId: l.id,
      poId: l.po.id,
      sku: l.sku,
      title: `${l.po.customerName} · ${l.productName}`,
      sub: `交期 ${l.po.requiredDeliveryDate} · 缺 ${l.gap}${l.unit}`,
      stage: 'ops_create' as const,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
}

export function getPipelineBottleneckStageKey(
  orders: ShortagePO[],
  refDate = new Date()
): PipelineStageKey | null {
  const stages = getPipelineChevronStages(orders, refDate)
  let maxPending = 0
  let bottleneck: PipelineStageKey | null = null

  for (const stage of stages) {
    if (stage.key === 'ops_create') continue
    const pending = Math.max(0, stage.progressTotal - stage.progressDone)
    if (pending > maxPending) {
      maxPending = pending
      bottleneck = stage.key
    }
  }

  return maxPending > 0 ? bottleneck : null
}

export function getStagePendingDetailItems(
  orders: ShortagePO[],
  stageKey: PipelineStageKey,
  refDate = new Date()
): RoleTaskItem[] {
  if (stageKey === 'ops_create') {
    return getOpsCreateTaskItems(orders, refDate)
  }

  const allLines = getShortageLines(orders)
  const scoped =
    stageKey === 'fulfillment_done'
      ? filterWeeklyLines(allLines, refDate)
      : filterDailyLines(allLines, refDate)

  return scoped
    .filter((l) => lineMatchesPipelineFilter(l, stageKey))
    .map((l) => ({
      id: l.id,
      lineId: l.id,
      poId: l.po.id,
      sku: l.sku,
      title: `${l.po.customerName} · ${l.productName}`,
      sub: stageDetailSub(l, stageKey),
      stage: stageKey,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
}

export function lineMatchesPipelineFilter(
  line: ShortagePOLine,
  filter: PipelineStageFilter
): boolean {
  if (!line.isShortage) return false
  switch (filter) {
    case 'procurement_advice':
      return lineNeedsProcurementAdvice(line) && !isProcurementAdviceDone(line)
    case 'sales_method':
      return (
        lineNeedsProcurementAdvice(line) &&
        isProcurementAdviceDone(line) &&
        !isSalesMethodDone(line)
      )
    case 'procurement':
      return isProcurementSku(line) && !isProcurementDone(line)
    case 'fulfillment_done':
      return !isFulfillmentDone(line) && (isSalesMethodDone(line) || isLogisticsFulfillment(line.fulfillmentMethod))
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
    return []
  }

  if (role === 'sales') {
    return lines
      .filter(
        (l) =>
          lineNeedsProcurementAdvice(l) &&
          isProcurementAdviceDone(l) &&
          !isSalesMethodDone(l) &&
          matchFilter(l)
      )
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

  const adviceTasks = lines
    .filter(
      (l) => lineNeedsProcurementAdvice(l) && !isProcurementAdviceDone(l) && matchFilter(l)
    )
    .map((l) => ({
      id: l.id,
      lineId: l.id,
      poId: l.po.id,
      sku: l.sku,
      title: `${l.po.customerName} · ${l.productName}`,
      sub: `还缺 ${l.gap}${l.unit} · 测算履约建议`,
      stage: 'procurement_advice' as const,
    }))

  const sourceTasks = lines
    .filter((l) => isLineVisibleToProcurement(l) && !isProcurementDone(l) && matchFilter(l))
    .map((l) => ({
      id: l.id,
      lineId: l.id,
      poId: l.po.id,
      sku: l.sku,
      title: `${l.productName} · ${l.po.customerName}`,
      sub: `还缺 ${l.gap}${l.unit} · 当期到货寻源`,
      stage: 'procurement' as const,
    }))

  return [...adviceTasks, ...sourceTasks]
}

/** 加载/同步时应用后台直发、正常补货算路 */
export function applyBackendLogisticsRouting(orders: ShortagePO[]): ShortagePO[] {
  return orders.map((po) => ({
    ...po,
    lines: po.lines.map((line) => {
      if (!line.isShortage) return recomputeLineStatus(line)
      const auto = resolveBackendLogisticsMethod(line, po)
      if (!auto) return recomputeLineStatus(line)
      return recomputeLineStatus({
        ...line,
        fulfillmentMethod: auto,
        opsAdvice: '',
        salesNote: '',
        supplierName: '',
        selectedSupplierId: '',
        amount: 0,
        procurementDraftNo: '',
        procurementConfirmed: false,
        recommendedSuppliers: [],
        salesOutboundType: 'order_direct',
        salesOutboundNo: line.salesOutboundNo || `SO-D-AUTO-${line.id.slice(-4)}`,
        expectedFulfillQty: line.gap,
      })
    }),
  }))
}

export function ensureLineSuppliers(line: ShortagePOLine): ShortagePOLine {
  if (line.recommendedSuppliers.length > 0) return line
  if (line.fulfillmentMethod !== 'must_on_time') return line
  return { ...line, recommendedSuppliers: getRecommendedSuppliers(line.sku) }
}

const DONE_METHOD_KEYS: FulfillmentMethod[] = [
  'direct_ship',
  'normal_replenishment',
  'defer',
  'must_on_time',
]

export function getOpsCreateSummary(orders: ShortagePO[], refDate = new Date()): OpsCreateSummary {
  const allLines = getShortageLines(orders)
  const dailyLines = filterDailyLines(allLines, refDate)
  const dailyPoIds = new Set(dailyLines.map((l) => l.po.id))
  const parsedPoIds = new Set(
    dailyLines.filter((l) => l.status !== 'new' || l.fulfillmentMethod !== 'pending').map((l) => l.po.id)
  )

  return {
    poSynced: orders.filter((po) => po.lines.some((l) => l.isShortage)).length,
    poParsed: parsedPoIds.size > 0 ? parsedPoIds.size : dailyPoIds.size,
    shortageLineCount: dailyLines.length,
    skuCount: uniqueShortageSkus(dailyLines).length,
    hotelCount: new Set(dailyLines.map((l) => l.po.customerName)).size,
    totalGapQty: dailyLines.reduce((s, l) => s + l.gap, 0),
  }
}

/** 履约完成分布图例：按品项（缺货行）计数 */
export function formatSkuMixCount(count: number): string {
  return `${count}个品`
}

export function getFulfillmentDoneSummary(
  orders: ShortagePO[],
  refDate = new Date()
): FulfillmentDoneSummary {
  const allLines = getShortageLines(orders)
  const weeklyLines = filterWeeklyLines(allLines, refDate)
  const completed = weeklyLines.filter(isFulfillmentDone)
  const counts = new Map<FulfillmentMethod, number>()
  for (const key of DONE_METHOD_KEYS) counts.set(key, 0)
  for (const line of completed) {
    const m = line.fulfillmentMethod
    if (DONE_METHOD_KEYS.includes(m)) counts.set(m, (counts.get(m) ?? 0) + 1)
  }
  const total = completed.length
  const methodMix = DONE_METHOD_KEYS.map((method) => ({
    method,
    label: FULFILLMENT_METHOD_LABEL[method],
    count: counts.get(method) ?? 0,
    percent: total > 0 ? Math.round(((counts.get(method) ?? 0) / total) * 100) : 0,
  }))

  return {
    hotelCount: new Set(completed.map((l) => l.po.customerName)).size,
    orderCount: new Set(completed.map((l) => l.po.id)).size,
    completedLineCount: completed.length,
    methodMix,
  }
}

export function getTasksForFlowKind(orders: ShortagePO[], kind: TaskFlowKind): RoleTaskItem[] {
  if (kind === 'sales_method') {
    return getTasksForRole(orders, 'sales', 'sales_method')
  }
  const all = getTasksForRole(orders, 'procurement')
  return all.filter((t) => t.stage === kind)
}

export const TASK_FLOW_TITLES: Record<TaskFlowKind, string> = {
  sales_method: '上传缺货履约方式',
  procurement_advice: '确认缺货履约建议',
  procurement: '执行缺货寻源',
}
