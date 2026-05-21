export type WorkflowPhase =
  | 'idle'
  | 'parsing'
  | 'pendingReview'
  | 'convertingSales'
  | 'matchingInventory'
  | 'shortageWait'
  | 'creatingPO'
  | 'completed'

export type Tab = 'chat' | 'tracking'

export type TrackingSystem = 'order' | 'inventory' | 'purchase'

export type TrackingViewMode = 'launch' | 'login' | 'app'

export interface TrackingScreenState {
  view: TrackingViewMode
  activeField: string | null
  filledFields: Record<string, string>
  highlightedSkus: string[]
  tableRowsVisible: number
  flashSave: boolean
  statusText: string
  loginProgress?: number
  headerEdited?: boolean
}

export type MessageKind =
  | 'user'
  | 'system'
  | 'execution'
  | 'pending_order'
  | 'shortage_table'
  | 'action'

export interface OrderLineItem {
  sku: string
  name: string
  spec: string
  quantity: number
  unit: string
}

export interface PendingOrder {
  id: string
  hotelName: string
  contact: string
  lines: OrderLineItem[]
  updatedAt: string
}

export interface ShortageLine {
  sku: string
  name: string
  required: number
  available: number
  gap: number
}

export interface PurchaseDraft {
  supplier: string
  amount: number
}

export interface SalesOrder {
  id: string
  pendingOrderId: string
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  supplier: string
  amount: number
  createdAt: string
}

export interface ChatMessage {
  id: string
  kind: MessageKind
  content?: string
  timestamp: string
  executionSteps?: string[]
  executionStreaming?: boolean
  pendingOrder?: PendingOrder
  shortageLines?: ShortageLine[]
  actionType?: 'confirm_sales' | 'generate_po'
}

export interface TrackingEvent {
  id: string
  title: string
  detail: string
  status: 'pending' | 'running' | 'done'
  timestamp: string
}

export interface AgentStep {
  label: string
  detail: string
  durationMs: number
  system?: TrackingSystem
  screenAction?: string
}

export type AgentRunStepStatus = 'pending' | 'running' | 'done'

export type AgentStepIcon = 'search' | 'click' | 'input' | 'done'

export interface AgentRunStep {
  id: string
  title: string
  actionLabel: string
  displayText: string
  icon: AgentStepIcon
  system?: TrackingSystem
  status: AgentRunStepStatus
}
