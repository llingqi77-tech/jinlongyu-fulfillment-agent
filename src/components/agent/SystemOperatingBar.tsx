import { useWorkflowStore } from '../../store/workflowStore'

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SystemOperatingBar() {
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)
  const systemOpStep = useWorkflowStore((s) => s.systemOpStep)
  const systemOpDetail = useWorkflowStore((s) => s.systemOpDetail)
  const agentElapsedSec = useWorkflowStore((s) => s.agentElapsedSec)
  const phase = useWorkflowStore((s) => s.phase)

  if (!isAgentRunning) return null

  const phaseLabel: Record<string, string> = {
    parsing: '解析订单',
    convertingSales: '转销售单',
    matchingInventory: '库存匹配',
    creatingPO: '采购录入',
    idle: '处理中',
  }

  return (
    <div className="shrink-0 px-3 pb-2">
      <div className="flex items-center gap-3 rounded-card bg-card px-3 py-3 shadow-soft">
        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex h-full flex-col items-center justify-center gap-0.5 p-1">
            <div className="h-1 w-6 rounded bg-border" />
            <div className="h-1 w-5 rounded bg-border" />
            <div className="h-1 w-6 rounded bg-border" />
            <div className="mt-1 h-3 w-5 rounded-sm bg-accent/30" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            <span className="truncate text-sm font-medium text-ink">
              {systemOpStep || '系统操作中'}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">
            {formatElapsed(agentElapsedSec)} · {phaseLabel[phase] ?? '执行中'} ·{' '}
            {systemOpDetail || '正在同步订单系统…'}
          </p>
        </div>
      </div>
    </div>
  )
}
