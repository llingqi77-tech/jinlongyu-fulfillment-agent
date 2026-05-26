import { create } from 'zustand'
import { MOCK_SHORTAGE_ORDERS } from '../mocks/shortageOrders'
import type {
  ActivityEvent,
  FulfillmentMethod,
  PipelineStageFilter,
  ShortagePO,
  WorkbenchRole,
} from '../types/shortage'
import {
  ensureLineSuppliers,
  recomputeLineStatus,
} from '../utils/shortageAggregations'
import { syncLegacySalesUrgency } from '../utils/shortageLineDefaults'
import type { SupplierStockStatus } from '../types/shortage'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const nowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

function cloneOrders(orders: ShortagePO[]): ShortagePO[] {
  return orders.map((po) => ({
    ...po,
    lines: po.lines.map((l) => ({ ...l, recommendedSuppliers: [...l.recommendedSuppliers] })),
  }))
}

interface ShortageState {
  workbenchOpen: boolean
  role: WorkbenchRole
  orders: ShortagePO[]
  selectedTaskLineId: string | null
  activityEvents: ActivityEvent[]
  generatePoLineId: string | null
  pipelineFilter: PipelineStageFilter | null
  toast: string | null
  signoffTimerId: ReturnType<typeof setInterval> | null

  openWorkbench: () => void
  closeWorkbench: () => void
  setRole: (role: WorkbenchRole) => void
  setPipelineFilter: (filter: PipelineStageFilter | null) => void
  selectTaskLine: (lineId: string | null) => void
  loadTodayShortages: () => void
  setOpsAdvice: (lineId: string, advice: string) => void
  setFulfillmentMethod: (lineId: string, method: FulfillmentMethod, note?: string) => void
  setSupplierStock: (lineId: string, supplierId: string, hasStock: SupplierStockStatus) => void
  selectSupplier: (lineId: string, supplierId: string) => void
  applyCustomSupplier: (lineId: string, name: string, amount: number, supplierId?: string) => void
  generateProcurementDraft: (lineId: string) => void
  openGeneratePo: (lineId: string) => void
  closeGeneratePo: () => void
  confirmProcurementToErp: (lineId: string) => void
  applySignoff: (lineId: string, qty?: number) => void
  startSignoffMock: () => void
  stopSignoffMock: () => void
  pushActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  setToast: (msg: string | null) => void
}

function patchLine(
  orders: ShortagePO[],
  lineId: string,
  patch: Partial<ShortagePO['lines'][0]>
): ShortagePO[] {
  return orders.map((po) => ({
    ...po,
    lines: po.lines.map((line) => {
      if (line.id !== lineId) return line
      const merged = ensureLineSuppliers({ ...line, ...patch })
      return recomputeLineStatus(merged)
    }),
  }))
}

function createSalesOutboundNo(type: 'order_direct' | 'backorder') {
  const prefix = type === 'order_direct' ? 'SO-D' : 'SO-B'
  return `${prefix}-${Date.now().toString().slice(-8)}`
}

export const useShortageStore = create<ShortageState>((set, get) => ({
  workbenchOpen: false,
  role: 'ops',
  orders: [],
  selectedTaskLineId: null,
  activityEvents: [],
  generatePoLineId: null,
  pipelineFilter: null,
  toast: null,
  signoffTimerId: null,

  openWorkbench: () => {
    const { orders, signoffTimerId } = get()
    if (orders.length === 0) get().loadTodayShortages()
    if (!signoffTimerId) get().startSignoffMock()
    set({ workbenchOpen: true })
  },

  closeWorkbench: () => {
    get().stopSignoffMock()
    set({ workbenchOpen: false, generatePoLineId: null, selectedTaskLineId: null })
  },

  setRole: (role) =>
    set({
      role,
      selectedTaskLineId: null,
      pipelineFilter: null,
    }),

  setPipelineFilter: (filter) =>
    set((s) => ({
      pipelineFilter: s.pipelineFilter === filter ? null : filter,
      selectedTaskLineId: null,
    })),

  selectTaskLine: (lineId) => set({ selectedTaskLineId: lineId }),

  loadTodayShortages: () => {
    const orders = cloneOrders(MOCK_SHORTAGE_ORDERS)
    set({
      orders,
      activityEvents: [
        {
          id: uid(),
          timestamp: nowTime(),
          actor: '系统',
          type: 'sync',
          content: `今日缺货已同步：${orders.length} 张待转单，已推送运营/销售/采购`,
        },
      ],
    })
  },

  setOpsAdvice: (lineId, advice) => {
    const orders = patchLine(get().orders, lineId, { opsAdvice: advice.trim() })
    set({ orders })
    get().pushActivity({
      actor: '运营',
      type: 'ops',
      content: '已确认 Agent 履约建议并流转销售',
      ref: { poId: get().orders.find((o) => o.lines.some((l) => l.id === lineId))?.id },
    })
    get().setToast('履约建议已确认，已流转销售')
  },

  setFulfillmentMethod: (lineId, method, note = '') => {
    const line = get()
      .orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o })))
      .find((l) => l.id === lineId)
    if (!line) return

    const patch: Partial<ShortagePO['lines'][0]> = {
      fulfillmentMethod: method,
      salesNote: note,
      salesUrgency: syncLegacySalesUrgency(method),
    }

    if (method === 'direct_ship' || method === 'normal_replenishment' || method === 'substitute') {
      patch.salesOutboundType = 'order_direct'
      patch.salesOutboundNo = line.salesOutboundNo || createSalesOutboundNo('order_direct')
      patch.expectedFulfillQty = line.gap
    } else if (method === 'defer') {
      patch.salesOutboundType = 'backorder'
      patch.salesOutboundNo = line.salesOutboundNo || createSalesOutboundNo('backorder')
      patch.expectedFulfillQty = line.gap
    } else if (method === 'must_on_time') {
      patch.salesOutboundType = null
      patch.recommendedSuppliers = line.recommendedSuppliers.length
        ? line.recommendedSuppliers
        : ensureLineSuppliers(line).recommendedSuppliers
    }

    const orders = patchLine(get().orders, lineId, patch)
    set({ orders })
    const poId = get().orders.find((o) => o.lines.some((l) => l.id === lineId))?.id
    get().pushActivity({
      actor: '销售',
      type: 'sales',
      content:
        method === 'must_on_time'
          ? '已确认当期到货（加急），已流转采购'
          : `已确认履约方式并生成出库单`,
      ref: { poId },
    })
    get().setToast(
      method === 'must_on_time'
        ? '已转采购寻源'
        : `已生成${patch.salesOutboundType === 'backorder' ? ' Backorder ' : ' '}销售出库订单`
    )
  },

  setSupplierStock: (lineId, supplierId, hasStock) => {
    const orders = get().orders.map((po) => ({
      ...po,
      lines: po.lines.map((line) => {
        if (line.id !== lineId) return line
        return {
          ...line,
          recommendedSuppliers: line.recommendedSuppliers.map((s) =>
            s.id === supplierId ? { ...s, hasStock } : s
          ),
        }
      }),
    }))
    set({ orders })
  },

  selectSupplier: (lineId, supplierId) => {
    const line = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
    const supplier = line?.recommendedSuppliers.find((s) => s.id === supplierId)
    if (!supplier) return
    const orders = patchLine(get().orders, lineId, {
      selectedSupplierId: supplierId,
      supplierName: supplier.name,
    })
    set({ orders })
  },

  applyCustomSupplier: (lineId, name, amount, supplierId = 'custom') => {
    const orders = patchLine(get().orders, lineId, {
      selectedSupplierId: supplierId,
      supplierName: name.trim(),
      amount,
      procurementMode: 'normal',
    })
    set({ orders })
    get().setToast(supplierId === 'custom' ? '已录入自定义供应商' : '已选用供应商')
  },

  generateProcurementDraft: (lineId) => {
    const draftNo = `DRAFT-${Date.now().toString().slice(-5)}`
    const orders = patchLine(get().orders, lineId, { procurementDraftNo: draftNo })
    set({ orders, generatePoLineId: lineId })
    get().pushActivity({
      actor: 'Agent',
      type: 'procurement',
      content: `已生成采购订单草稿 ${draftNo}`,
    })
  },

  openGeneratePo: (lineId) => set({ generatePoLineId: lineId }),
  closeGeneratePo: () => set({ generatePoLineId: null }),

  confirmProcurementToErp: (lineId) => {
    const poNumber = `PU-${Date.now().toString().slice(-6)}`
    const line = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
    const orders = patchLine(get().orders, lineId, {
      procurementConfirmed: true,
      opsPoNumber: poNumber,
      procurementMode: 'urgent',
      expectedFulfillQty: (line?.expectedFulfillQty ?? 0) + (line?.gap ?? 0),
    })
    set({ orders, generatePoLineId: null })
    get().pushActivity({
      actor: '运营',
      type: 'ops',
      content: `采购订单 ${poNumber} 已写入金龙鱼采购系统`,
    })
    get().setToast(`采购订单 ${poNumber} 已确认下发`)
  },

  applySignoff: (lineId, qty) => {
    const line = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
    if (!line || !line.isShortage) return
    const signQty = qty ?? line.gap
    const actual = Math.min(line.expectedFulfillQty || line.gap, signQty)
    const orders = patchLine(get().orders, lineId, {
      actualFulfillQty: actual,
      signoffStatus: actual >= (line.expectedFulfillQty || line.gap) ? 'signed' : 'partial',
      signoffAt: new Date().toISOString().slice(0, 10),
    })
    set({ orders })
    get().pushActivity({
      actor: '物流',
      type: 'logistics',
      content: `客户签收 ${actual}${line.unit}`,
    })
  },

  startSignoffMock: () => {
    if (get().signoffTimerId) return
    const id = setInterval(() => {
      const pending = get()
        .orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o })))
        .find(
          (l) =>
            l.isShortage &&
            l.expectedFulfillQty > 0 &&
            l.signoffStatus !== 'signed' &&
            ['await_logistics', 'ready_for_po'].includes(l.status)
        )
      if (pending) get().applySignoff(pending.id)
    }, 12000)
    set({ signoffTimerId: id })
  },

  stopSignoffMock: () => {
    const id = get().signoffTimerId
    if (id) clearInterval(id)
    set({ signoffTimerId: null })
  },

  pushActivity: (event) =>
    set((s) => ({
      activityEvents: [
        ...s.activityEvents,
        { ...event, id: uid(), timestamp: nowTime() },
      ],
    })),

  setToast: (msg) => {
    set({ toast: msg })
    if (msg) setTimeout(() => set({ toast: null }), 2800)
  },
}))
