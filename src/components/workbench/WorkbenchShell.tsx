import { WorkbenchNav } from './WorkbenchNav'
import { WorkbenchContent } from './WorkbenchContent'
import { useShortageStore } from '../../store/shortageStore'
import type { WorkbenchRole } from '../../types/shortage'

const ROLES: { id: WorkbenchRole; label: string }[] = [
  { id: 'ops', label: '运营' },
  { id: 'sales', label: '销售' },
  { id: 'procurement', label: '采购' },
]

export function WorkbenchShell() {
  const role = useShortageStore((s) => s.role)
  const setRole = useShortageStore((s) => s.setRole)
  const closeWorkbench = useShortageStore((s) => s.closeWorkbench)
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <header className="flex shrink-0 items-center gap-4 border-b border-pale-stone/15 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-ink">缺货履约 Agent 工作台</h1>
          <p className="text-[11px] text-muted">今日缺货 · {today}</p>
        </div>
        <div className="flex rounded-full border-2 border-off-black/15 p-0.5">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                role === r.id ? 'bg-off-black text-paper-canvas' : 'text-ink hover:bg-segment-track'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={closeWorkbench}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-segment-track hover:text-ink"
          aria-label="关闭工作台"
        >
          ✕
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <WorkbenchNav />
        <main className="relative min-h-0 min-w-0 flex-1 overflow-auto bg-paper-canvas p-4">
          <WorkbenchContent />
        </main>
      </div>
    </>
  )
}
