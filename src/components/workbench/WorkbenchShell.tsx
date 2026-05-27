import { WorkbenchContent } from './WorkbenchContent'
import { WorkbenchOverlay } from './pipeline/WorkbenchOverlay'
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
      <header className="workbench-header">
        <div className="workbench-header__brand">
          <div className="workbench-header__logo" aria-hidden>
            AI
          </div>
          <div className="min-w-0">
            <h1 className="workbench-header__title">缺货履约工作台</h1>
            <p className="workbench-header__meta">{today}</p>
          </div>
        </div>

        <div className="role-segment" role="tablist" aria-label="工作台角色">
          {ROLES.map((r) => {
            const active = role === r.id
            return (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRole(r.id)}
                className={`role-segment__btn ${active ? 'role-segment__btn--active' : ''}`}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={closeWorkbench}
          className="workbench-header__close"
          aria-label="关闭工作台"
        >
          ✕
        </button>
      </header>
      <main className="workbench-main">
        <WorkbenchContent />
        <WorkbenchOverlay />
      </main>
    </>
  )
}
