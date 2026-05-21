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
      className={`absolute top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-chat-primary-light)] bg-card/95 text-[var(--color-chat-primary)] shadow-soft backdrop-blur-sm active:opacity-80 ${
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
        className="text-[var(--color-chat-primary)]"
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
