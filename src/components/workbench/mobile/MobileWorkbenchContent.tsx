import { useShortageStore } from '../../../store/shortageStore'
import { MobileAgentActivating } from './MobileAgentActivating'
import { MobileAgentHome } from './MobileAgentHome'
import { MobileRolePickScreen } from './MobileRolePickScreen'

export function MobileWorkbenchContent() {
  const phase = useShortageStore((s) => s.mobileOnboardingPhase)

  if (phase === 'role_pick') return <MobileRolePickScreen />
  if (phase === 'activating') return <MobileAgentActivating />
  return <MobileAgentHome />
}
