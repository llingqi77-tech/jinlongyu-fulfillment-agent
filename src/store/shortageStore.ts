import { create } from 'zustand'
import { MOCK_SHORTAGE_ORDERS } from '../mocks/shortageOrders'
import type {
  ActivityEvent,
  SalesUrgency,
  ShortagePO,
  SupplyPlanInput,
  OpsListFilter,
  WorkbenchNav,
  WorkbenchRole,
} from '../types/shortage'
import { recomputeLineStatus } from '../utils/shortageAggregations'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const nowTime = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

function cloneOrders(orders: ShortagePO[]): ShortagePO[] {
  return orders.map((po) => ({
    ...po,
    lines: po.lines.map((l) => ({ ...l })),
  }))
}

const ROLE_DEFAULT_NAV: Record<WorkbenchRole, WorkbenchNav> = {
  ops: 'home',
  sales: 'home',
  procurement: 'home',
}

interface ShortageState {
  workbenchOpen: boolean
  role: WorkbenchRole
  nav: WorkbenchNav
  orders: ShortagePO[]
  selectedPoId: string | null
  selectedSku: string | null
  selectedHotel: string | null
  activityEvents: ActivityEvent[]
  generatePoPoId: string | null
  supplyDialog: { lineId: string } | null
  toast: string | null
  opsListFilter: OpsListFilter | null

  openWorkbench: () => void
  closeWorkbench: () => void
  setRole: (role: WorkbenchRole) => void
  setNav: (nav: WorkbenchNav) => void
  goToOpsFilteredList: (filter: OpsListFilter) => void
  clearOpsListFilter: () => void
  loadTodayShortages: () => void
  selectPo: (id: string | null) => void
  selectSku: (sku: string | null) => void
  selectHotel: (hotel: string | null) => void
  setSalesIntent: (lineId: string, urgency: SalesUrgency, note: string) => void
  setSalesIntentForPo: (poId: string, urgency: SalesUrgency, note: string) => void
  openSupplyDialog: (payload: { lineId: string }) => void
  closeSupplyDialog: () => void
  applySupplyPlan: (input: SupplyPlanInput, target: { lineIds: string[] }) => void
  openGeneratePo: (poId: string) => void
  closeGeneratePo: () => void
  generatePurchaseOrder: (poId: string, lineIds: string[]) => void
  pushActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  setToast: (msg: string | null) => void
  updateOrders: (updater: (orders: ShortagePO[]) => ShortagePO[]) => void
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
      const next = { ...line, ...patch }
      return recomputeLineStatus(next)
    }),
  }))
}

export const useShortageStore = create<ShortageState>((set, get) => ({
  workbenchOpen: false,
  role: 'ops',
  nav: 'home',
  orders: [],
  selectedPoId: null,
  selectedSku: null,
  selectedHotel: null,
  activityEvents: [],
  generatePoPoId: null,
  supplyDialog: null,
  toast: null,
  opsListFilter: null,

  openWorkbench: () => {
    const { orders } = get()
    if (orders.length === 0) get().loadTodayShortages()
    set({ workbenchOpen: true })
  },

  closeWorkbench: () => set({ workbenchOpen: false, supplyDialog: null, generatePoPoId: null }),

  setRole: (role) =>
    set({
      role,
      nav: ROLE_DEFAULT_NAV[role],
      selectedPoId: null,
      selectedSku: null,
      selectedHotel: null,
      opsListFilter: null,
    }),

  setNav: (nav) =>
    set({
      nav,
      opsListFilter: nav === 'home' ? null : get().opsListFilter,
      ...(nav === 'tasks'
        ? {
            selectedPoId: null,
            selectedSku: null,
            selectedHotel: null,
            opsListFilter: null,
          }
        : {}),
    }),

  goToOpsFilteredList: (filter) =>
    set({
      nav: 'home',
      opsListFilter: filter,
      selectedPoId: null,
      selectedSku: null,
      selectedHotel: null,
    }),

  clearOpsListFilter: () => set({ opsListFilter: null }),

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
          content: `今日缺货已同步：${orders.length} 张缺货单，已推送运营/销售/采购`,
        },
      ],
    })
  },

  selectPo: (id) => set({ selectedPoId: id }),
  selectSku: (sku) => set({ selectedSku: sku }),
  selectHotel: (hotel) => set({ selectedHotel: hotel }),

  setSalesIntent: (lineId, urgency, note) => {
    const orders = patchLine(get().orders, lineId, {
      salesUrgency: urgency,
      salesNote: note,
    })
    set({ orders })
    get().pushActivity({
      actor: '销售',
      type: 'sales',
      content: `已登记客户时效：${urgency === 'must_on_time' ? '必须当期到货' : '不急'}`,
      ref: { poId: get().orders.find((o) => o.lines.some((l) => l.id === lineId))?.id },
    })
  },

  setSalesIntentForPo: (poId, urgency, note) => {
    const orders = get().orders.map((po) => {
      if (po.id !== poId) return po
      return {
        ...po,
        lines: po.lines.map((line) => {
          if (!line.isShortage) return line
          return recomputeLineStatus({
            ...line,
            salesUrgency: urgency,
            salesNote: note,
          })
        }),
      }
    })
    set({ orders })
    get().pushActivity({
      actor: '销售',
      type: 'sales',
      content: `批量登记 ${poId} 客户时效`,
      ref: { poId },
    })
  },

  openSupplyDialog: (payload) => set({ supplyDialog: payload }),
  closeSupplyDialog: () => set({ supplyDialog: null }),

  applySupplyPlan: (input, { lineIds }) => {
    let orders = get().orders
    for (const lineId of lineIds) {
      orders = patchLine(orders, lineId, {
        supplierName: input.supplierName,
        amount: input.amount,
        eta: '',
        isExpedited: false,
        expediteFee: 0,
        procurementMode: 'normal',
      })
    }
    set({ orders, supplyDialog: null })
    get().pushActivity({
      actor: '采购',
      type: 'procurement',
      content: `已录入供应方案：${input.supplierName}，金额 ¥${input.amount.toLocaleString()}`,
    })
    get().setToast('方案已保存，已流转运营生成采购订单')
  },

  openGeneratePo: (poId) => set({ generatePoPoId: poId }),
  closeGeneratePo: () => set({ generatePoPoId: null }),

  generatePurchaseOrder: (poId, lineIds) => {
    const poNumber = `PU-${Date.now().toString().slice(-6)}`
    const orders = get().orders.map((po) => {
      if (po.id !== poId) return po
      return {
        ...po,
        lines: po.lines.map((line) => {
          if (!lineIds.includes(line.id)) return line
          return {
            ...line,
            status: 'completed' as const,
            opsPoNumber: poNumber,
          }
        }),
      }
    })
    set({ orders, generatePoPoId: null })
    get().pushActivity({
      actor: '运营',
      type: 'ops',
      content: `已生成采购订单 ${poNumber} 并写入系统`,
      ref: { poId },
    })
    get().setToast(`采购订单 ${poNumber} 已生成`)
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

  updateOrders: (updater) => set((s) => ({ orders: updater(s.orders) })),
}))
