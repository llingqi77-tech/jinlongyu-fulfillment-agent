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
    <div className="flex gap-1 border-b border-pale-stone/20 bg-atmosphere-wash/30 px-2 py-1.5">
      {SYSTEMS.map((sys) => {
        const isActive = active === sys.id
        return (
          <button
            key={sys.id}
            type="button"
            disabled={isAgentRunning && !isActive}
            onClick={() => setTrackingSystem(sys.id)}
            className={`px-3 py-1 text-[11px] font-medium transition-all ${
              isActive
                ? 'rounded-button bg-off-black text-paper-canvas shadow-soft'
                : 'btn-secondary-sm rounded-lg !px-3 !py-1'
            } ${isAgentRunning && !isActive ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {sys.label}
          </button>
        )
      })}
    </div>
  )
}
