import { useWorkflowStore } from '../../store/workflowStore'

export function AgentRunningBanner() {
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)

  if (!isAgentRunning) return null

  return (
    <div className="shrink-0 border-t border-border/60 bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="text-sm font-medium text-ink">agent执行中</span>
      </div>
    </div>
  )
}
