import { useWorkflowStore } from '../../store/workflowStore'
import type { Tab } from '../../types/workflow'

export function TopBar() {
  const activeTab = useWorkflowStore((s) => s.activeTab)
  const setActiveTab = useWorkflowStore((s) => s.setActiveTab)
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)
  const startNewSession = useWorkflowStore((s) => s.startNewSession)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chat', label: '对话' },
    { id: 'tracking', label: '追踪' },
  ]

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink"
          aria-label="返回"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {activeTab === 'chat' && (
          <span className="truncate text-[15px] font-medium tracking-tight text-ink">
            完美履约
          </span>
        )}
      </div>

      <div className="flex flex-1 justify-center">
        <div className="flex rounded-full border border-off-black/15 bg-segment-track p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[72px] rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-off-black text-paper-canvas shadow-soft'
                  : 'text-pale-stone'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'chat' ? (
        <button
          type="button"
          disabled={isAgentRunning}
          onClick={() => startNewSession()}
          className="btn-secondary-icon h-9 w-9 shrink-0 disabled:opacity-40"
          aria-label="新建"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden />
      )}
    </header>
  )
}
