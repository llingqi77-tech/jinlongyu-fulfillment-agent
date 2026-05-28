// LLM integration point: replace rule-based parsers with model tool calls when wired.

import type {
  FulfillmentMethod,
  MobileHomeKpis,
  MobileKpiDimension,
  RoleTaskItem,
  ShortagePO,
  WorkbenchRole,
} from '../types/shortage'
import { FULFILLMENT_METHOD_LABEL, PIPELINE_STAGE_SHORT } from '../constants/shortageLabels'
import { lineNeedsProcurementAdvice } from './fulfillmentMethodRules'
import {
  daysRemaining,
  getShortageLines,
  getTasksForRole,
  isDeliveryToday,
  isFulfillmentDone,
  isProcurementAdviceDone,
  isProcurementDone,
  isSalesMethodDone,
  isLineVisibleToProcurement,
} from './shortageAggregations'

export type { MobileHomeKpis, MobileKpiDimension }

export const MOBILE_KPI_DIMENSION_LABEL: Record<MobileKpiDimension, string> = {
  sku: '品（SKU）',
  hotel: '酒店',
  po: 'PO 单',
}

export const MOBILE_KPI_DIMENSION_OPTIONS: MobileKpiDimension[] = ['sku', 'hotel', 'po']

function countDistinct<T>(items: T[], key: (item: T) => string | undefined): number {
  const set = new Set<string>()
  for (const item of items) {
    const v = key(item)
    if (v) set.add(v)
  }
  return set.size
}

type TodayLine = ReturnType<typeof getTodayShortageLines>[number]

function countByDimension(lines: TodayLine[], dimension: MobileKpiDimension): number {
  if (dimension === 'sku') return countDistinct(lines, (l) => l.sku)
  if (dimension === 'hotel') return countDistinct(lines, (l) => l.po.customerName)
  return countDistinct(lines, (l) => l.po.id)
}

function countPendingByDimension(tasks: RoleTaskItem[], dimension: MobileKpiDimension): number {
  if (dimension === 'sku') return countDistinct(tasks, (t) => t.sku)
  if (dimension === 'hotel') return countDistinct(tasks, (t) => t.customerName)
  return countDistinct(tasks, (t) => t.poId)
}

export function getMobileKpiShortageLabel(dimension: MobileKpiDimension): string {
  switch (dimension) {
    case 'sku':
      return '缺货品'
    case 'hotel':
      return '缺货酒店'
    case 'po':
      return '缺货 PO'
  }
}

const STAGE_LABEL: Record<string, string> = {
  procurement_advice: PIPELINE_STAGE_SHORT.procurement_advice,
  sales_method: PIPELINE_STAGE_SHORT.sales_method,
  procurement: PIPELINE_STAGE_SHORT.procurement,
  ops_create: '待同步',
  fulfillment_done: '履约完成',
}

function urgencyScore(requiredDate: string): number {
  const days = daysRemaining(requiredDate)
  return Math.max(0, 100 - days * 10)
}

function enrichTask(task: RoleTaskItem, orders: ShortagePO[]): RoleTaskItem {
  const line = orders
    .flatMap((po) => po.lines.map((l) => ({ ...l, po })))
    .find((l) => l.id === task.lineId)
  if (!line) return task

  const delivery = line.po.requiredDeliveryDate
  const days = daysRemaining(delivery)

  return {
    ...task,
    customerName: line.po.customerName,
    productName: line.productName,
    requiredDeliveryDate: delivery,
    gap: line.gap,
    unit: line.unit,
    stageLabel: STAGE_LABEL[task.stage] ?? task.stage,
    urgencyScore: urgencyScore(delivery),
    sub: `交期 ${delivery.slice(5)}（${days} 天）· 缺 ${line.gap}${line.unit} · ${STAGE_LABEL[task.stage] ?? task.stage}`,
  }
}

/** 运营：全链路未完成缺货行（只读监控清单） */
function getOpsMonitorTasks(orders: ShortagePO[]): RoleTaskItem[] {
  const lines = getShortageLines(orders).filter((l) => !isFulfillmentDone(l))

  return lines.map((l) => {
    let stage: RoleTaskItem['stage'] = 'ops_create'
    if (!isProcurementAdviceDone(l) && lineNeedsProcurementAdvice(l)) {
      stage = 'procurement_advice'
    } else if (!isSalesMethodDone(l) && lineNeedsProcurementAdvice(l)) {
      stage = 'sales_method'
    } else if (isLineVisibleToProcurement(l) && !isProcurementDone(l)) {
      stage = 'procurement'
    } else if (isFulfillmentDone(l)) {
      stage = 'fulfillment_done'
    }

    const task: RoleTaskItem = {
      id: l.id,
      lineId: l.id,
      poId: l.po.id,
      sku: l.sku,
      title: `${l.po.customerName} · ${l.productName}`,
      sub: '',
      stage,
    }
    return enrichTask(task, orders)
  })
}

export function getRoleTasksSorted(orders: ShortagePO[], role: WorkbenchRole): RoleTaskItem[] {
  const base =
    role === 'ops' ? getOpsMonitorTasks(orders) : getTasksForRole(orders, role)

  return base
    .map((t) => enrichTask(t, orders))
    .sort((a, b) => {
      const dateA = a.requiredDeliveryDate ?? '9999-12-31'
      const dateB = b.requiredDeliveryDate ?? '9999-12-31'
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0)
    })
}

function getTodayShortageLines(orders: ShortagePO[]) {
  return getShortageLines(orders).filter((l) => isDeliveryToday(l.po.requiredDeliveryDate))
}

export function getMobileHomeKpis(
  orders: ShortagePO[],
  role: WorkbenchRole,
  dimension: MobileKpiDimension = 'sku'
): MobileHomeKpis {
  const daily = getTodayShortageLines(orders)
  const tasks = getRoleTasksSorted(orders, role)
  const fulfilledLines = daily.filter((l) => isFulfillmentDone(l))
  const skus = new Set(daily.map((l) => l.sku))

  return {
    dimension,
    fulfilledCount: countByDimension(fulfilledLines, dimension),
    pendingTaskCount: countPendingByDimension(tasks, dimension),
    shortageLineCount: countByDimension(daily, dimension),
    shortageSkuCount: skus.size,
    totalGap: daily.reduce((s, l) => s + l.gap, 0),
  }
}

export function getRoleWelcomeLine(role: WorkbenchRole): string {
  switch (role) {
    case 'sales':
      return '嗨，我是你的完美履约助手。今天你的任务数据和清单如下，你想先完成哪一个？'
    case 'procurement':
      return '你好，我是采购履约助手。以下是需要你处理的缺货任务，按客户交期紧急程度排序。'
    case 'ops':
      return '你好，我是运营履约助手。以下是今日缺货与各环节待办概览，你可以随时向我提问。'
  }
}

export function findTaskByUserText(
  tasks: RoleTaskItem[],
  text: string
): RoleTaskItem | null {
  const t = text.trim()
  if (!t) return null

  const indexMatch = t.match(/第\s*(\d+)\s*个/)
  if (indexMatch) {
    const idx = Number(indexMatch[1]) - 1
    if (idx >= 0 && idx < tasks.length) return tasks[idx]
  }

  const lower = t.toLowerCase()
  const hit = tasks.find((task) => {
    const title = task.title.toLowerCase()
    const customer = (task.customerName ?? '').toLowerCase()
    const product = (task.productName ?? '').toLowerCase()
    const sku = task.sku.toLowerCase()
    return (
      title.includes(lower) ||
      lower.includes(customer) ||
      lower.includes(product) ||
      (sku.length > 3 && lower.includes(sku)) ||
      [...customer, ...product].some((part) => part.length >= 2 && lower.includes(part))
    )
  })
  return hit ?? null
}

export interface ParsedFulfillment {
  method: FulfillmentMethod
  note: string
  label: string
}

export function parseSalesFulfillmentFromText(text: string): ParsedFulfillment | null {
  const t = text.trim()
  if (!t) return null

  if (/顺延|延期|下周|往后|推迟/.test(t)) {
    return { method: 'defer', note: t.slice(0, 120), label: FULFILLMENT_METHOD_LABEL.defer }
  }
  if (/当期|加急|按时|必须到货|紧急/.test(t)) {
    return { method: 'must_on_time', note: t.slice(0, 120), label: FULFILLMENT_METHOD_LABEL.must_on_time }
  }
  if (/直发/.test(t)) {
    return {
      method: 'direct_ship',
      note: t.slice(0, 120),
      label: FULFILLMENT_METHOD_LABEL.direct_ship,
    }
  }
  if (/补货|在途|正常补/.test(t)) {
    return {
      method: 'normal_replenishment',
      note: t.slice(0, 120),
      label: FULFILLMENT_METHOD_LABEL.normal_replenishment,
    }
  }
  if (/换品|平替|替代/.test(t)) {
    return {
      method: 'substitute',
      note: t.slice(0, 120),
      label: FULFILLMENT_METHOD_LABEL.substitute,
    }
  }
  if (/确认|同意|可以|好的|就按/.test(t)) {
    return { method: 'defer', note: t.slice(0, 120), label: FULFILLMENT_METHOD_LABEL.defer }
  }

  return null
}

export function parseProcurementAdviceFromText(text: string): string | null {
  const t = text.trim()
  if (!t) return null
  if (/确认|同意|可以|当期|加急/.test(t)) {
    return t.slice(0, 40) || '建议销售沟通延期或当期加急'
  }
  return t.slice(0, 40)
}

export function parseSupplierChoiceFromText(
  text: string,
  supplierNames: string[]
): { index: number; name?: string } | null {
  const t = text.trim()
  if (/第一家|第一个|推荐.*一|top\s*1/i.test(t)) return { index: 0 }
  if (/第二|第二个/.test(t)) return { index: 1 }
  if (/第三|第三个/.test(t)) return { index: 2 }

  for (let i = 0; i < supplierNames.length; i++) {
    if (t.includes(supplierNames[i])) return { index: i, name: supplierNames[i] }
  }
  return null
}

export const ROLE_LABEL: Record<WorkbenchRole, string> = {
  ops: '运营',
  sales: '销售',
  procurement: '采购',
}

export type MobileTaskListTab = 'pending' | 'done'

export function getMobileTaskListItems(
  orders: ShortagePO[],
  role: WorkbenchRole,
  tab: MobileTaskListTab,
  hotelFilter?: string | null,
  sortAsc = true
): RoleTaskItem[] {
  let items: RoleTaskItem[]
  if (tab === 'pending') {
    items = getRoleTasksSorted(orders, role)
  } else {
    const daily = getTodayShortageLines(orders)
    items = daily
      .filter((l) => isFulfillmentDone(l))
      .map((l) => {
        const task: RoleTaskItem = {
          id: l.id,
          lineId: l.id,
          poId: l.po.id,
          sku: l.sku,
          title: `${l.po.customerName} · ${l.productName}`,
          sub: '',
          stage: 'fulfillment_done',
        }
        return enrichTask(task, orders)
      })
  }

  if (hotelFilter) {
    items = items.filter((t) => t.customerName === hotelFilter || t.title.includes(hotelFilter))
  }

  return items.sort((a, b) => {
    const dateA = a.requiredDeliveryDate ?? '9999-12-31'
    const dateB = b.requiredDeliveryDate ?? '9999-12-31'
    return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA)
  })
}

export function getMobileTaskListHotels(orders: ShortagePO[], role: WorkbenchRole): string[] {
  const pending = getRoleTasksSorted(orders, role)
  const done = getMobileTaskListItems(orders, role, 'done')
  const names = new Set<string>()
  for (const t of [...pending, ...done]) {
    if (t.customerName) names.add(t.customerName)
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

export const MOBILE_SUGGESTED_QUESTIONS = [
  '今天缺货数据有多少？',
  '今天已履约完成了多少？',
  '我还有多少待办任务？',
  '哪些任务最紧急？',
  '任务卡在哪个节点？',
  '香格里拉酒店的调和油怎么样了？',
] as const
