import { useShortageStore } from '../../../store/shortageStore'
import type { WorkbenchRole } from '../../../types/shortage'

const ROLES: { id: WorkbenchRole; label: string; desc: string; icon: string }[] = [
  { id: 'ops', label: '运营', desc: '掌握全链路缺货与各环节进度', icon: '📊' },
  { id: 'sales', label: '销售', desc: '确认客户履约方式并推动闭环', icon: '🤝' },
  { id: 'procurement', label: '采购', desc: '提供履约建议与紧急寻源', icon: '📦' },
]

export function MobileRolePickScreen() {
  const setRole = useShortageStore((s) => s.setRole)
  const setMobileOnboardingPhase = useShortageStore((s) => s.setMobileOnboardingPhase)

  const pick = (role: WorkbenchRole) => {
    setRole(role)
    setMobileOnboardingPhase('activating')
  }

  return (
    <div className="mobile-role-pick">
      <p className="mobile-role-pick__lead">请选择你的角色，我将为你激活专属的智能履约助手</p>
      <ul className="mobile-role-pick__list">
        {ROLES.map((r) => (
          <li key={r.id}>
            <button type="button" className="mobile-role-pick__card" onClick={() => pick(r.id)}>
              <span className="mobile-role-pick__icon" aria-hidden>
                {r.icon}
              </span>
              <span className="mobile-role-pick__body">
                <span className="mobile-role-pick__label">{r.label}</span>
                <span className="mobile-role-pick__desc">{r.desc}</span>
              </span>
              <span className="mobile-role-pick__arrow" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
