import { create } from 'zustand'
import { MOCK_SHORTAGE_ORDERS } from '../mocks/shortageOrders'
import type {
  ActivityEvent,
  FulfillmentMethod,
  MobileAgentPhase,
  MobileChatMessage,
  MobileOnboardingPhase,
  PipelineStageFilter,
  PipelineStageKey,
  ShortagePO,
  TaskFlowKind,
  WorkbenchOverlayView,
  WorkbenchRole,
} from '../types/shortage'
import { getMobileHomeKpis, getRoleTasksSorted } from '../utils/mobileAgentSummary'
import {
  applyBackendLogisticsRouting,
  ensureLineSuppliers,
  getTasksForFlowKind,
  recomputeLineStatus,
} from '../utils/shortageAggregations'
import { syncLegacySalesUrgency } from '../utils/shortageLineDefaults'
import {
  isLogisticsFulfillment,
  lineNeedsProcurementAdvice,
  showsSalesNote,
  showsSupplierProcurement,
} from '../utils/fulfillmentMethodRules'
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

export interface ShortageState {
  workbenchOpen: boolean
  role: WorkbenchRole
  orders: ShortagePO[]
  selectedTaskLineId: string | null
  activityEvents: ActivityEvent[]
  generatePoLineId: string | null
  pipelineFilter: PipelineStageFilter | null
  toast: string | null
  signoffTimerId: ReturnType<typeof setInterval> | null
  overlayView: WorkbenchOverlayView | null
  mobileChatMessages: MobileChatMessage[]
  activeTaskLineId: string | null
  mobileAgentPhase: MobileAgentPhase
  mobileOnboardingPhase: MobileOnboardingPhase
  mobileDashboardOpen: boolean
  mobileTaskListOpen: boolean
  mobilePipelineStageKey: PipelineStageKey | null
  mobileTaskDisplayIndex: number

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
  submitOaApproval: (lineId: string) => void
  receiveOaApproval: (lineId: string, status: 'approved' | 'rejected') => void
  generateProcurementDraft: (lineId: string) => void
  openGeneratePo: (lineId: string) => void
  closeGeneratePo: () => void
  confirmProcurementToErp: (lineId: string) => void
  applySignoff: (lineId: string, qty?: number) => void
  startSignoffMock: () => void
  stopSignoffMock: () => void
  pushActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void
  setToast: (msg: string | null) => void
  openOverlay: (view: WorkbenchOverlayView) => void
  closeOverlay: () => void
  openTaskFlow: (kind: TaskFlowKind) => void
  closeTaskFlow: () => void
  checkTaskFlowComplete: () => void
  resetMobileAgentSession: () => void
  appendMobileChat: (msg: Omit<MobileChatMessage, 'id' | 'timestamp'>) => void
  setActiveTask: (lineId: string | null) => void
  setMobileAgentPhase: (phase: MobileAgentPhase) => void
  setMobileTaskDisplayIndex: (index: number) => void
  completeActiveMobileTask: (payload: {
    fulfillmentMethod?: FulfillmentMethod
    salesNote?: string
    opsAdvice?: string
    supplierIndex?: number
  }) => boolean
  setMobileOnboardingPhase: (phase: MobileOnboardingPhase) => void
  finishMobileActivation: () => void
  openMobileDashboardSheet: () => void
  closeMobileDashboardSheet: () => void
  openMobileTaskListSheet: () => void
  closeMobileTaskListSheet: () => void
  openMobilePipelineStageSheet: (stageKey: PipelineStageKey) => void
  closeMobilePipelineStageSheet: () => void
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
  overlayView: null,
  mobileChatMessages: [],
  activeTaskLineId: null,
  mobileAgentPhase: 'idle',
  mobileOnboardingPhase: 'role_pick',
  mobileDashboardOpen: false,
  mobileTaskListOpen: false,
  mobilePipelineStageKey: null,
  mobileTaskDisplayIndex: 0,

  openWorkbench: () => {
    const { signoffTimerId } = get()
    get().loadTodayShortages()
    if (!signoffTimerId) get().startSignoffMock()
    set({
      workbenchOpen: true,
      selectedTaskLineId: null,
      pipelineFilter: null,
      overlayView: null,
      mobileChatMessages: [],
      activeTaskLineId: null,
      mobileAgentPhase: 'idle',
      mobileOnboardingPhase: 'role_pick',
      mobileDashboardOpen: false,
      mobileTaskListOpen: false,
      mobilePipelineStageKey: null,
      mobileTaskDisplayIndex: 0,
    })
  },

  closeWorkbench: () => {
    get().stopSignoffMock()
    set({
      workbenchOpen: false,
      generatePoLineId: null,
      selectedTaskLineId: null,
      overlayView: null,
      mobileOnboardingPhase: 'role_pick',
      mobileDashboardOpen: false,
      mobileTaskListOpen: false,
      mobilePipelineStageKey: null,
      mobileChatMessages: [],
      activeTaskLineId: null,
      mobileAgentPhase: 'idle',
      mobileTaskDisplayIndex: 0,
    })
  },

  setRole: (role) => {
    set({
      role,
      selectedTaskLineId: null,
      pipelineFilter: null,
      overlayView: null,
      mobileChatMessages: [],
      activeTaskLineId: null,
      mobileAgentPhase: 'idle',
      mobileTaskDisplayIndex: 0,
    })
  },

  setPipelineFilter: (filter) =>
    set((s) => ({
      pipelineFilter: s.pipelineFilter === filter ? null : filter,
      selectedTaskLineId: null,
    })),

  selectTaskLine: (lineId) => set({ selectedTaskLineId: lineId }),

  loadTodayShortages: () => {
    const orders = applyBackendLogisticsRouting(cloneOrders(MOCK_SHORTAGE_ORDERS))
    set({
      orders,
      activityEvents: [
        {
          id: uid(),
          timestamp: nowTime(),
          actor: '系统',
          type: 'sync',
          content: `今日缺货已同步：${orders.length} 张待转单；直发/正常补货已算路，采购/销售待办已推送`,
        },
      ],
    })
  },

  setOpsAdvice: (lineId, advice) => {
    const line = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
    if (!line || !lineNeedsProcurementAdvice(line)) return
    const orders = patchLine(get().orders, lineId, { opsAdvice: advice.trim() })
    set({ orders })
    get().pushActivity({
      actor: '采购',
      type: 'procurement',
      content: '已确认缺货履约建议并流转销售沟通',
      ref: { poId: get().orders.find((o) => o.lines.some((l) => l.id === lineId))?.id },
    })
    get().setToast('缺货履约建议已确认，已流转销售')
    get().checkTaskFlowComplete()
  },

  setFulfillmentMethod: (lineId, method, note = '') => {
    const line = get()
      .orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o })))
      .find((l) => l.id === lineId)
    if (!line) return

    const patch: Partial<ShortagePO['lines'][0]> = {
      fulfillmentMethod: method,
      salesNote: showsSalesNote(method) ? note : '',
      salesUrgency: syncLegacySalesUrgency(method),
    }

    if (isLogisticsFulfillment(method)) {
      patch.opsAdvice = ''
      patch.salesNote = ''
      patch.supplierName = ''
      patch.selectedSupplierId = ''
      patch.amount = 0
      patch.procurementDraftNo = ''
      patch.procurementConfirmed = false
      patch.recommendedSuppliers = []
    } else if (!showsSupplierProcurement(method)) {
      patch.supplierName = ''
      patch.selectedSupplierId = ''
      patch.amount = 0
      patch.procurementDraftNo = ''
      patch.procurementConfirmed = false
      patch.recommendedSuppliers = []
    }

    if (method === 'direct_ship' || method === 'normal_replenishment') {
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
    get().checkTaskFlowComplete()
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
      procurementMode: 'urgent',
      oaApprovalStatus: 'none',
      oaRequestNo: '',
      procurementDraftNo: '',
      procurementConfirmed: false,
    })
    set({ orders, generatePoLineId: null })
    get().setToast(supplierId === 'custom' ? '已录入自定义供应商' : '已选用供应商')
  },

  submitOaApproval: (lineId) => {
    const line = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
    if (!line?.supplierName || line.amount <= 0) {
      get().setToast('请先选用供应商')
      return
    }
    if (line.fulfillmentMethod !== 'must_on_time') {
      get().generateProcurementDraft(lineId)
      return
    }
    const oaRequestNo = `OA-${Date.now().toString().slice(-8)}`
    const orders = patchLine(get().orders, lineId, {
      oaApprovalStatus: 'pending',
      oaRequestNo,
      procurementMode: 'urgent',
      procurementDraftNo: '',
      procurementConfirmed: false,
    })
    set({ orders, generatePoLineId: null })
    get().pushActivity({
      actor: '采购',
      type: 'procurement',
      content: `已提交 OA 审批 ${oaRequestNo}（${line.supplierName} · ¥${line.amount.toLocaleString()}）`,
    })
    get().pushActivity({
      actor: 'Agent',
      type: 'system',
      content: `寻源单已推送 OA 系统，单号 ${oaRequestNo}，等待审批结果回传…`,
    })
    get().setToast('已提交 OA 审批')

    window.setTimeout(() => {
      const current = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
      if (current?.oaApprovalStatus === 'pending') {
        get().receiveOaApproval(lineId, 'approved')
      }
    }, 2800)
  },

  receiveOaApproval: (lineId, status) => {
    const line = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
    if (!line || line.oaApprovalStatus !== 'pending') return

    if (status === 'approved') {
      const orders = patchLine(get().orders, lineId, { oaApprovalStatus: 'approved' })
      set({ orders })
      get().pushActivity({
        actor: 'OA系统',
        type: 'procurement',
        content: `审批单 ${line.oaRequestNo} 回传状态：Approve，可生成采购订单`,
      })
      get().pushActivity({
        actor: 'Agent',
        type: 'procurement',
        content: `OA 已通过，请为 ${line.productName} 生成采购订单并下发 ERP`,
      })
      get().setToast('OA 审批已通过')
      return
    }

    const orders = patchLine(get().orders, lineId, {
      oaApprovalStatus: 'rejected',
      procurementDraftNo: '',
    })
    set({ orders, generatePoLineId: null })
    get().pushActivity({
      actor: 'OA系统',
      type: 'procurement',
      content: `审批单 ${line.oaRequestNo} 回传状态：Reject`,
    })
    get().setToast('OA 审批已驳回，请调整供应商后重新提交')
  },

  generateProcurementDraft: (lineId) => {
    const line = get().orders.flatMap((o) => o.lines).find((l) => l.id === lineId)
    if (
      line?.fulfillmentMethod === 'must_on_time' &&
      line.oaApprovalStatus !== 'approved'
    ) {
      get().setToast('当期到货须先完成 OA 审批')
      return
    }
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
    get().checkTaskFlowComplete()
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

  openOverlay: (view) => {
    if (view !== 'ops_chat') {
      const tasks = getTasksForFlowKind(get().orders, view)
      if (tasks.length === 0) {
        get().setToast('当前无待办任务')
        return
      }
      set({
        overlayView: view,
        selectedTaskLineId: tasks[0].lineId,
      })
      return
    }
    set({ overlayView: view, selectedTaskLineId: null })
  },

  closeOverlay: () => set({ overlayView: null, selectedTaskLineId: null }),

  openTaskFlow: (kind) => get().openOverlay(kind),

  closeTaskFlow: () => get().closeOverlay(),

  checkTaskFlowComplete: () => {
    const { overlayView, orders } = get()
    if (!overlayView || overlayView === 'ops_chat') return
    const remaining = getTasksForFlowKind(orders, overlayView)
    if (remaining.length === 0) {
      get().setToast('全部待办已完成')
      get().closeOverlay()
    }
  },

  resetMobileAgentSession: () =>
    set({
      mobileChatMessages: [],
      activeTaskLineId: null,
      mobileAgentPhase: 'idle',
      mobileTaskDisplayIndex: 0,
    }),

  appendMobileChat: (msg) =>
    set((s) => ({
      mobileChatMessages: [
        ...s.mobileChatMessages,
        {
          ...msg,
          id: uid(),
          timestamp: nowTime(),
        },
      ],
    })),

  setActiveTask: (lineId) => set({ activeTaskLineId: lineId }),

  setMobileAgentPhase: (phase) => set({ mobileAgentPhase: phase }),

  setMobileTaskDisplayIndex: (index) => set({ mobileTaskDisplayIndex: index }),

  completeActiveMobileTask: (payload) => {
    const { activeTaskLineId, orders, role } = get()
    if (!activeTaskLineId || role === 'ops') return false

    const ctx = orders
      .flatMap((o) => o.lines.map((l) => ({ ...l, po: o })))
      .find((l) => l.id === activeTaskLineId)
    if (!ctx) return false

    if (role === 'sales' && payload.fulfillmentMethod) {
      get().setFulfillmentMethod(
        activeTaskLineId,
        payload.fulfillmentMethod,
        payload.salesNote ?? ''
      )
      return true
    }

    if (role === 'procurement') {
      if (payload.opsAdvice !== undefined) {
        get().setOpsAdvice(activeTaskLineId, payload.opsAdvice)
        return true
      }

      if (payload.supplierIndex !== undefined) {
        const line = ensureLineSuppliers(ctx)
        const supplier = line.recommendedSuppliers[payload.supplierIndex]
        if (!supplier) return false
        const amount = Math.round(ctx.gap * ctx.unitPrice * 0.9)
        get().applyCustomSupplier(activeTaskLineId, supplier.name, amount, supplier.id)

        if (ctx.fulfillmentMethod === 'must_on_time') {
          const updated = get()
            .orders.flatMap((o) => o.lines)
            .find((l) => l.id === activeTaskLineId)
          if (updated?.supplierName) {
            get().submitOaApproval(activeTaskLineId)
            window.setTimeout(() => {
              const cur = get().orders.flatMap((o) => o.lines).find((l) => l.id === activeTaskLineId)
              if (cur?.oaApprovalStatus === 'approved' && !cur.procurementConfirmed) {
                get().generateProcurementDraft(activeTaskLineId)
                get().confirmProcurementToErp(activeTaskLineId)
              }
            }, 3000)
          }
        } else {
          get().generateProcurementDraft(activeTaskLineId)
          get().confirmProcurementToErp(activeTaskLineId)
        }
        return true
      }
    }

    return false
  },

  setMobileOnboardingPhase: (phase) => set({ mobileOnboardingPhase: phase }),

  finishMobileActivation: () => {
    const { orders, role } = get()
    const kpis = getMobileHomeKpis(orders, role)
    const tasks = getRoleTasksSorted(orders, role)
    set({
      mobileOnboardingPhase: 'ready',
      mobileChatMessages: [],
      activeTaskLineId: null,
      mobileAgentPhase: 'idle',
      mobileTaskDisplayIndex: 0,
    })

    get().appendMobileChat({
      side: 'agent',
      content: '',
      kind: 'welcome_card',
      meta: { kpis, tasks },
      stream: true,
    })
  },

  openMobileDashboardSheet: () => set({ mobileDashboardOpen: true }),
  closeMobileDashboardSheet: () => set({ mobileDashboardOpen: false }),
  openMobileTaskListSheet: () => set({ mobileTaskListOpen: true }),
  closeMobileTaskListSheet: () => set({ mobileTaskListOpen: false }),
  openMobilePipelineStageSheet: (stageKey) =>
    set({ mobilePipelineStageKey: stageKey, mobileTaskListOpen: false }),
  closeMobilePipelineStageSheet: () => set({ mobilePipelineStageKey: null }),
}))
