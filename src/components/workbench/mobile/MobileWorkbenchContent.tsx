import { WorkbenchAgentDialog } from '../pipeline/WorkbenchAgentDialog'
import { WorkbenchRoleDock } from '../pipeline/WorkbenchRoleDock'
import { MobileFulfillmentDashboard } from './MobileFulfillmentDashboard'

export function MobileWorkbenchContent() {
  return (
    <div className="mobile-dashboard-layout">
      <MobileFulfillmentDashboard />
      <div className="mobile-dashboard-dock">
        <WorkbenchRoleDock />
        <WorkbenchAgentDialog />
      </div>
    </div>
  )
}
