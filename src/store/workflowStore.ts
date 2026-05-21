import { create } from 'zustand'
import {
  MOCK_PARSED_ORDER,
  MOCK_SHORTAGE_LINES,
  MOCK_TODAY_EMAIL_ORDERS,
  VOICE_EDIT_SAMPLES,
} from '../mocks/parsedOrder'
import { NEW_SESSION_MARKER } from '../constants/session'
import { INITIAL_SCREEN } from './trackingScreen'
import { actionLabel, formatStepDisplay, stepIcon } from '../utils/agentLabels'
import type {
  AgentRunStep,
  AgentStep,
  ChatMessage,
  PendingOrder,
  PurchaseDraft,
  PurchaseOrder,
  SalesOrder,
  Tab,
  TrackingEvent,
  TrackingScreenState,
  TrackingSystem,
  WorkflowPhase,
} from '../types/workflow'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const now = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

interface WorkflowState {
  phase: WorkflowPhase
  activeTab: Tab
  isAgentRunning: boolean
  systemOpStep: string
  systemOpDetail: string
  agentElapsedSec: number
  messages: ChatMessage[]
  trackingEvents: TrackingEvent[]
  pendingOrder: PendingOrder | null
  salesOrder: SalesOrder | null
  shortageLines: typeof MOCK_SHORTAGE_LINES | null
  purchaseDraft: PurchaseDraft | null
  purchaseOrder: PurchaseOrder | null
  showPurchaseModal: boolean
  voiceSampleIndex: number
  trackingSystem: TrackingSystem
  trackingScreen: TrackingScreenState
  trackingReady: boolean
  agentRunSteps: AgentRunStep[]
  emailSystemEnabled: boolean
  emailSystemLocked: boolean
  todayEmailOrders: PendingOrder[]

  setActiveTab: (tab: Tab) => void
  setEmailSystemEnabled: (enabled: boolean) => void
  lockEmailSystem: () => void
  initAgentRunSteps: (steps: AgentStep[]) => void
  setAgentRunStepStatus: (id: string, status: AgentRunStep['status']) => void
  clearAgentRunSteps: () => void
  setTrackingSystem: (system: TrackingSystem) => void
  setTrackingScreen: (screen: TrackingScreenState) => void
  startNewSession: () => void
  setShowPurchaseModal: (show: boolean) => void
  setAgentRunning: (running: boolean) => void
  setSystemOp: (step: string, detail: string) => void
  tickAgentElapsed: () => void
  resetAgentElapsed: () => void
  pushMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string }) => void
  startExecutionStream: () => void
  appendExecutionStep: (step: string) => void
  finishExecutionStream: () => void
  pushTracking: (event: Omit<TrackingEvent, 'id' | 'timestamp'>) => void
  updateTrackingStatus: (title: string, status: TrackingEvent['status']) => void

  uploadAndParse: (fileName: string) => void
  parseFromInstruction: (detail: string) => void
  parseTodayFromEmail: () => void
  applyUserEdit: (text: string) => void
  commitUserEdit: (text: string) => void
  applyVoiceEdit: () => void
  confirmToSalesOrder: () => void
  openPurchaseModal: () => void
  submitPurchaseOrder: (supplier: string, amount: number) => void
  sendUserMessage: (text: string) => void
  finishAgentTask: (phase: WorkflowPhase, onDone?: () => void) => void
}

function cloneOrder(order: PendingOrder): PendingOrder {
  return {
    ...order,
    lines: order.lines.map((l) => ({ ...l })),
    updatedAt: new Date().toISOString(),
  }
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  phase: 'idle',
  activeTab: 'chat',
  isAgentRunning: false,
  systemOpStep: '',
  systemOpDetail: '',
  agentElapsedSec: 0,
  messages: [
    {
      id: 'welcome',
      kind: 'system',
      content:
        '欢迎使用金龙鱼履约 Agent。支持关联邮件、上传微信图片、文字或语音输入订单要求，系统将自动打开追踪页完成履约流程。',
      timestamp: now(),
    },
  ],
  trackingEvents: [],
  pendingOrder: null,
  salesOrder: null,
  shortageLines: null,
  purchaseDraft: null,
  purchaseOrder: null,
  showPurchaseModal: false,
  voiceSampleIndex: 0,
  trackingSystem: 'order',
  trackingScreen: { ...INITIAL_SCREEN },
  trackingReady: true,
  agentRunSteps: [],
  emailSystemEnabled: false,
  emailSystemLocked: false,
  todayEmailOrders: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setEmailSystemEnabled: (enabled) => set({ emailSystemEnabled: enabled }),
  lockEmailSystem: () => set({ emailSystemLocked: true }),
  initAgentRunSteps: (steps) =>
    set({
      agentRunSteps: steps.map((s, i) => ({
        id: `run-${i}`,
        title: s.detail,
        actionLabel: actionLabel(s.screenAction),
        displayText: formatStepDisplay(s.detail, s.screenAction, s.system),
        icon: stepIcon(s.screenAction, s.detail),
        system: s.system,
        status: 'pending' as const,
      })),
    }),
  setAgentRunStepStatus: (id, status) =>
    set((s) => ({
      agentRunSteps: s.agentRunSteps.map((step) =>
        step.id === id ? { ...step, status } : step
      ),
    })),
  clearAgentRunSteps: () => set({ agentRunSteps: [] }),
  setTrackingSystem: (system) => set({ trackingSystem: system }),
  setTrackingScreen: (screen) => set({ trackingScreen: screen }),
  startNewSession: () => {
    const prev = get().messages
    set({
      activeTab: 'chat',
      phase: 'idle',
      pendingOrder: null,
      salesOrder: null,
      shortageLines: null,
      purchaseDraft: null,
      purchaseOrder: null,
      todayEmailOrders: [],
      emailSystemEnabled: false,
      emailSystemLocked: false,
      trackingEvents: [],
      trackingSystem: 'order',
      trackingScreen: { ...INITIAL_SCREEN, statusText: '已就绪，等待订单指令' },
      isAgentRunning: false,
      agentRunSteps: [],
      messages: [
        ...prev,
        {
          id: uid(),
          kind: 'system',
          content: NEW_SESSION_MARKER,
          timestamp: now(),
        },
      ],
    })
  },
  setShowPurchaseModal: (show) => set({ showPurchaseModal: show }),
  setAgentRunning: (running) => set({ isAgentRunning: running }),
  setSystemOp: (step, detail) => set({ systemOpStep: step, systemOpDetail: detail }),
  tickAgentElapsed: () =>
    set((s) => ({ agentElapsedSec: s.agentElapsedSec + 1 })),
  resetAgentElapsed: () => set({ agentElapsedSec: 0 }),

  pushMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...msg,
          id: msg.id ?? uid(),
          timestamp: now(),
        },
      ],
    })),

  startExecutionStream: () =>
    get().pushMessage({
      kind: 'execution',
      content: '执行全景',
      executionSteps: [],
      executionStreaming: true,
    }),

  appendExecutionStep: (step) =>
    set((s) => {
      const messages = [...s.messages]
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].kind === 'execution' && messages[i].executionStreaming) {
          messages[i] = {
            ...messages[i],
            executionSteps: [...(messages[i].executionSteps ?? []), step],
          }
          break
        }
      }
      return { messages }
    }),

  finishExecutionStream: () =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.executionStreaming ? { ...m, executionStreaming: false } : m
      ),
    })),

  pushTracking: (event) =>
    set((s) => ({
      trackingEvents: [
        ...s.trackingEvents,
        {
          ...event,
          id: uid(),
          timestamp: now(),
        },
      ],
    })),

  updateTrackingStatus: (title, status) =>
    set((s) => ({
      trackingEvents: s.trackingEvents.map((e) =>
        e.title === title ? { ...e, status } : e
      ),
    })),

  uploadAndParse: (fileName) => {
    get().pushMessage({ kind: 'user', content: `[上传文件] ${fileName}` })
    get().parseFromInstruction(`正在解析 ${fileName}`)
  },

  parseFromInstruction: (detail) => {
    set({ phase: 'parsing' })
    get().pushTracking({
      title: '解析客户订单',
      detail,
      status: 'running',
    })
  },

  parseTodayFromEmail: () => {
    const { pushTracking } = get()
    set({ phase: 'parsing' })
    pushTracking({
      title: '邮件订单解析',
      detail: '拉取并解析今日邮件中的订单',
      status: 'running',
    })
  },

  applyUserEdit: (text) => {
    get().pushMessage({ kind: 'user', content: text })
    get().commitUserEdit(text)
  },

  commitUserEdit: (text) => {
    const { pendingOrder, pushMessage } = get()
    if (!pendingOrder || get().phase !== 'pendingReview') return

    const prev = pendingOrder
    const updated = cloneOrder(pendingOrder)
    if (text.includes('100') && text.includes('JLY-5L-001')) {
      const line = updated.lines.find((l) => l.sku === 'JLY-5L-001')
      if (line) line.quantity = 100
    }
    if (text.includes('国贸')) {
      updated.hotelName = '北京国贸大酒店'
    }
    if (text.includes('删除') && text.includes('JLY-10KG-003')) {
      updated.lines = updated.lines.filter((l) => l.sku !== 'JLY-10KG-003')
    }

    const editedSkus: string[] = []
    for (const line of updated.lines) {
      const oldLine = prev.lines.find((l) => l.sku === line.sku)
      if (!oldLine || oldLine.quantity !== line.quantity) editedSkus.push(line.sku)
    }
    prev.lines.forEach((line) => {
      if (!updated.lines.some((l) => l.sku === line.sku)) editedSkus.push(line.sku)
    })

    const screen = get().trackingScreen
    set({
      pendingOrder: updated,
      trackingScreen: {
        ...screen,
        view: 'app',
        filledFields: {
          hotelName: updated.hotelName,
          contact: updated.contact,
          orderId: updated.id,
        },
        tableRowsVisible: updated.lines.length,
        highlightedSkus: editedSkus,
        headerEdited: prev.hotelName !== updated.hotelName,
        activeField: null,
      },
    })
    pushMessage({
      kind: 'system',
      content: '待转单已更新',
    })
    pushMessage({
      kind: 'pending_order',
      pendingOrder: updated,
    })
    get().pushTracking({
      title: '待转单已更新',
      detail: `订单 ${updated.id} 已同步至订单系统`,
      status: 'done',
    })
  },

  applyVoiceEdit: () => {
    const idx = get().voiceSampleIndex
    const text = VOICE_EDIT_SAMPLES[idx % VOICE_EDIT_SAMPLES.length]
    set({ voiceSampleIndex: idx + 1 })
    get().applyUserEdit(`[语音] ${text}`)
  },

  confirmToSalesOrder: () => {
    set({ phase: 'convertingSales' })
    get().pushTracking({
      title: '转为销售订单',
      detail: '正在将待转单转为销售订单',
      status: 'running',
    })
  },

  openPurchaseModal: () => {
    if (get().phase === 'shortageWait') {
      set({ showPurchaseModal: true })
    }
  },

  submitPurchaseOrder: (supplier, amount) => {
    set({
      showPurchaseModal: false,
      phase: 'creatingPO',
      purchaseDraft: { supplier, amount },
    })
    get().pushTracking({
      title: '填写采购订单',
      detail: `供应商：${supplier}，金额 ¥${amount.toLocaleString()}`,
      status: 'running',
    })
  },

  sendUserMessage: (text) => {
    const phase = get().phase
    if (phase === 'pendingReview') {
      get().applyUserEdit(text)
      return
    }
    get().pushMessage({ kind: 'user', content: text })
  },

  finishAgentTask: (phase, onDone) => {
    set({
      phase,
      isAgentRunning: false,
      systemOpStep: '',
      systemOpDetail: '',
      activeTab: 'chat',
    })
    onDone?.()
  },
}))

export const EMAIL_PARSING_STEPS: AgentStep[] = [
  { label: '系统操作中', detail: '连接邮件 Agent 系统', durationMs: 1400, system: 'order', screenAction: 'order_launch' },
  { label: '系统操作中', detail: '拉取今日邮件订单', durationMs: 2000, system: 'order', screenAction: 'order_login' },
  { label: 'agent执行中', detail: '识别邮件中的订单信息', durationMs: 2200, system: 'order', screenAction: 'order_ocr' },
  { label: '系统操作中', detail: '批量写入订单系统', durationMs: 3000, system: 'order', screenAction: 'order_fill_lines' },
  { label: '系统操作中', detail: '保存全部待转单', durationMs: 1600, system: 'order', screenAction: 'order_save' },
]

export const PARSING_STEPS: AgentStep[] = [
  { label: '系统操作中', detail: '启动订单系统', durationMs: 1600, system: 'order', screenAction: 'order_launch' },
  { label: '系统操作中', detail: '登录 OMS 工作台', durationMs: 2000, system: 'order', screenAction: 'order_login' },
  { label: '系统操作中', detail: 'OCR 识别订单文档', durationMs: 1500, system: 'order', screenAction: 'order_ocr' },
  { label: '系统操作中', detail: '填写客户与酒店信息', durationMs: 2200, system: 'order', screenAction: 'order_fill_header' },
  { label: '系统操作中', detail: '录入 SKU 行项目', durationMs: 2600, system: 'order', screenAction: 'order_fill_lines' },
  { label: '系统操作中', detail: '保存订单', durationMs: 1600, system: 'order', screenAction: 'order_save' },
]

export const SALES_STEPS: AgentStep[] = [
  { label: '系统操作中', detail: '打开订单系统', durationMs: 1200, system: 'order', screenAction: 'order_open' },
  { label: '系统操作中', detail: '校验订单信息', durationMs: 1400, system: 'order', screenAction: 'order_fill_header' },
  { label: '系统操作中', detail: '生成销售订单', durationMs: 1800, system: 'order', screenAction: 'sales_convert' },
]

export const INVENTORY_STEPS: AgentStep[] = [
  { label: '系统操作中', detail: '启动库存系统', durationMs: 1400, system: 'inventory', screenAction: 'inventory_launch' },
  { label: '系统操作中', detail: '登录 WMS 工作台', durationMs: 1800, system: 'inventory', screenAction: 'inventory_login' },
  { label: '系统操作中', detail: '加载库存数据', durationMs: 1200, system: 'inventory', screenAction: 'inventory_open' },
  { label: '系统操作中', detail: '匹配 SKU 可用库存', durationMs: 2400, system: 'inventory', screenAction: 'inventory_match' },
]

export const ORDER_EDIT_STEPS: AgentStep[] = [
  { label: 'agent执行中', detail: '理解订单修改指令', durationMs: 900, system: 'order', screenAction: 'order_open' },
  { label: '系统操作中', detail: '同步修改至订单系统', durationMs: 1800, system: 'order', screenAction: 'order_edit' },
]

export const PO_STEPS: AgentStep[] = [
  { label: '系统操作中', detail: '启动采购系统', durationMs: 1400, system: 'purchase', screenAction: 'po_launch' },
  { label: '系统操作中', detail: '登录 SRM 工作台', durationMs: 1800, system: 'purchase', screenAction: 'po_login' },
  { label: '系统操作中', detail: '打开采购录入', durationMs: 1200, system: 'purchase', screenAction: 'po_open' },
  { label: '系统操作中', detail: '填写并提交采购单', durationMs: 2200, system: 'purchase', screenAction: 'po_fill' },
]

export function completeEmailParsing() {
  const store = useWorkflowStore.getState()
  const orders = MOCK_TODAY_EMAIL_ORDERS.map((o) => cloneOrder(o))
  const last = orders[orders.length - 1]!

  store.updateTrackingStatus('邮件订单解析', 'done')
  store.pushTracking({
    title: '今日邮件订单已录入',
    detail: `共 ${orders.length} 笔待转单已写入订单系统`,
    status: 'done',
  })
  store.pushMessage({
    kind: 'system',
    content: `已从邮件系统解析今日 ${orders.length} 笔订单，并已填写至订单系统。`,
  })
  for (const order of orders) {
    store.pushMessage({ kind: 'pending_order', pendingOrder: order })
  }
  store.pushMessage({
    kind: 'action',
    actionType: 'confirm_sales',
    content: '确认，并转为销售订单',
  })
  useWorkflowStore.setState({
    phase: 'pendingReview',
    pendingOrder: last,
    todayEmailOrders: orders,
    isAgentRunning: false,
    activeTab: 'chat',
    trackingSystem: 'order',
    trackingScreen: {
      activeField: null,
      filledFields: {
        hotelName: last.hotelName,
        contact: last.contact,
        orderId: last.id,
      },
      highlightedSkus: [],
      tableRowsVisible: last.lines.length,
      flashSave: false,
      statusText: `今日 ${orders.length} 笔订单已保存`,
      view: 'app',
    },
  })
}

export function completeParsing() {
  const store = useWorkflowStore.getState()
  const order = cloneOrder(MOCK_PARSED_ORDER)
  store.updateTrackingStatus('解析客户订单', 'done')
  store.pushTracking({
    title: '待转单已生成',
    detail: `订单 ${order.id} 已进入订单系统`,
    status: 'done',
  })
  store.pushMessage({
    kind: 'system',
    content: '订单已解析完毕',
  })
  store.pushMessage({
    kind: 'pending_order',
    pendingOrder: order,
  })
  store.pushMessage({
    kind: 'action',
    actionType: 'confirm_sales',
    content: '确认，并转为销售订单',
  })
  useWorkflowStore.setState({
    phase: 'pendingReview',
    pendingOrder: order,
    isAgentRunning: false,
    activeTab: 'chat',
    trackingSystem: 'order',
    trackingScreen: {
      activeField: null,
      filledFields: {
        hotelName: order.hotelName,
        contact: order.contact,
        orderId: order.id,
      },
      highlightedSkus: [],
      tableRowsVisible: order.lines.length,
      flashSave: false,
      statusText: '订单已保存',
      view: 'app',
    },
  })
}

export function completeSalesConversion() {
  const store = useWorkflowStore.getState()
  const order = store.pendingOrder
  if (!order) return

  const sales: SalesOrder = {
    id: `SO-${Date.now().toString().slice(-6)}`,
    pendingOrderId: order.id,
    createdAt: new Date().toISOString(),
  }

  store.updateTrackingStatus('转为销售订单', 'done')
  store.pushTracking({
    title: '销售订单已生成',
    detail: `销售单号 ${sales.id}`,
    status: 'done',
  })
  store.pushMessage({
    kind: 'system',
    content: '销售订单已生成，进入库存系统匹配',
  })
  useWorkflowStore.setState({
    phase: 'matchingInventory',
    salesOrder: sales,
  })
}

export function completeInventoryMatch() {
  const store = useWorkflowStore.getState()
  const lines = MOCK_SHORTAGE_LINES.filter((l) => l.gap > 0)

  store.pushTracking({
    title: '库存匹配完成',
    detail: `发现 ${lines.length} 个 SKU 缺货`,
    status: 'done',
  })
  store.pushMessage({
    kind: 'system',
    content: '库存匹配完成，以下 SKU 存在缺货：',
  })
  store.pushMessage({
    kind: 'shortage_table',
    shortageLines: MOCK_SHORTAGE_LINES,
  })
  store.pushMessage({
    kind: 'action',
    actionType: 'generate_po',
    content: '采购订单生成',
  })
  useWorkflowStore.setState({
    phase: 'shortageWait',
    shortageLines: MOCK_SHORTAGE_LINES,
    isAgentRunning: false,
    activeTab: 'chat',
  })
}

export function completePurchaseOrder(supplier: string, amount: number) {
  const store = useWorkflowStore.getState()
  const po: PurchaseOrder = {
    id: `PU-${Date.now().toString().slice(-6)}`,
    supplier,
    amount,
    createdAt: new Date().toISOString(),
  }

  store.updateTrackingStatus('填写采购订单', 'done')
  store.pushTracking({
    title: '采购订单已写入',
    detail: `采购单号 ${po.id}，¥${amount.toLocaleString()}`,
    status: 'done',
  })
  store.pushMessage({
    kind: 'system',
    content: `采购订单已生成并写入订单系统。供应商：${supplier}，金额 ¥${amount.toLocaleString()}。履约流程已完成。`,
  })
  useWorkflowStore.setState({
    phase: 'completed',
    purchaseOrder: po,
    isAgentRunning: false,
    activeTab: 'chat',
  })
}
