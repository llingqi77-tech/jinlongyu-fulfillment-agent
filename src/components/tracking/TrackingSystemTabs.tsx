import { useWorkflowStore } from '../../store/workflowStore'
import type { TrackingSystem } from '../../types/workflow'

const SYSTEMS: { id: TrackingSystem; label: string }[] = [
  { id: 'order', label: '订单' },
  { id: 'inventory', label: '库存' },
  { id: 'purchase', label: '采购' },
]

export function TrackingSystemTabs() {
  const active = useWorkflowStore((s) => s.trackingSystem)
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)
  const setTrackingSystem = useWorkflowStore((s) => s.setTrackingSystem)

  return (
    <div className="flex gap-1 border-b border-[#E5E5EA] bg-[#FAFBFC] px-2 py-1.5">
      {SYSTEMS.map((sys) => {
        const isActive = active === sys.id
        return (
          <button
            key={sys.id}
            type="button"
            disabled={isAgentRunning && !isActive}
            onClick={() => setTrackingSystem(sys.id)}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-all ${
              isActive
                ? 'bg-[var(--color-chat-primary)] text-white shadow-soft'
                : 'text-muted hover:bg-[var(--color-chat-primary-light)]/60 hover:text-[var(--color-chat-primary)]'
            } ${isAgentRunning && !isActive ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {sys.label}
          </button>
        )
      })}
    </div>
  )
}
