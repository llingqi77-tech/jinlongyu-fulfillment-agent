import { useWorkflowStore } from '../../store/workflowStore'
import { systemLabel } from '../../utils/agentLabels'

export function TrackingTimeline() {
  const steps = useWorkflowStore((s) => s.agentRunSteps)
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)

  if (steps.length === 0) return null

  return (
    <div className="shrink-0 border-t border-[var(--color-chat-primary-light)] bg-card/95 px-3 py-2 backdrop-blur-sm">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-chat-primary)]/70">
        Agent 操作轨迹
      </p>
      <ul className="max-h-[88px] space-y-1 overflow-y-auto">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-[11px] ${
              step.status === 'running'
                ? 'bg-[var(--color-chat-primary-light)]/80 text-[var(--color-chat-primary)]'
                : step.status === 'done'
                  ? 'text-muted line-through opacity-70'
                  : 'text-muted'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                step.status === 'running'
                  ? 'animate-pulse bg-[var(--color-chat-primary)]'
                  : step.status === 'done'
                    ? 'bg-accent'
                    : 'bg-border'
              }`}
            />
            {step.system && (
              <span className="shrink-0 rounded bg-[var(--color-chat-primary-light)] px-1 py-0.5 text-[9px] font-medium text-[var(--color-chat-primary)]">
                {systemLabel(step.system).replace('系统', '')}
              </span>
            )}
            <span className="min-w-0 truncate">{step.displayText}</span>
            {step.status === 'running' && isAgentRunning && (
              <span className="ml-auto shrink-0 text-[9px] text-[var(--color-chat-primary)]">
                进行中
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
