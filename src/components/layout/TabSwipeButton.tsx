import { useWorkflowStore } from '../../store/workflowStore'

type Direction = 'toTracking' | 'toChat'

interface TabSwipeButtonProps {
  direction: Direction
}

export function TabSwipeButton({ direction }: TabSwipeButtonProps) {
  const setActiveTab = useWorkflowStore((s) => s.setActiveTab)

  const isToTracking = direction === 'toTracking'

  return (
    <button
      type="button"
      onClick={() => setActiveTab(isToTracking ? 'tracking' : 'chat')}
      className={`btn-secondary-icon absolute top-1/2 z-30 h-9 w-9 -translate-y-1/2 backdrop-blur-sm ${
        isToTracking ? 'right-2' : 'left-2'
      }`}
      aria-label={isToTracking ? '滑动至追踪' : '滑动至对话'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-off-black"
      >
        {isToTracking ? (
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}
