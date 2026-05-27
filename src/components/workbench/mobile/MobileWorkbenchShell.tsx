import { WorkbenchOverlay } from '../pipeline/WorkbenchOverlay'
import { useShortageStore } from '../../../store/shortageStore'
import type { WorkbenchRole } from '../../../types/shortage'
import { MobileWorkbenchContent } from './MobileWorkbenchContent'

const ROLES: { id: WorkbenchRole; label: string }[] = [
  { id: 'ops', label: '运营' },
  { id: 'sales', label: '销售' },
  { id: 'procurement', label: '采购' },
]

/** 测试用角色切换；上线后由系统注入角色，可移除此栏 */
export function MobileWorkbenchShell() {
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
      <header className="mobile-workbench-header">
        <div className="mobile-workbench-header__top">
          <div className="mobile-workbench-header__brand">
            <div className="workbench-header__logo" aria-hidden>
              AI
            </div>
            <div className="mobile-workbench-header__text">
              <h1 className="mobile-workbench-header__title">工作台</h1>
              <p className="mobile-workbench-header__meta">{today}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeWorkbench}
            className="mobile-workbench-header__close"
            aria-label="关闭工作台"
          >
            ✕
          </button>
        </div>

        <div
          className="role-segment mobile-workbench-header__roles"
          role="tablist"
          aria-label="工作台角色（测试）"
        >
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
      </header>
      <main className="workbench-main">
        <MobileWorkbenchContent />
        <WorkbenchOverlay />
      </main>
    </>
  )
}
