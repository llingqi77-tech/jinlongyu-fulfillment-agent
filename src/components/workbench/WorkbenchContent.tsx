import { FulfillmentPipeline } from './pipeline/FulfillmentPipeline'
import { WorkbenchRoleDock } from './pipeline/WorkbenchRoleDock'
import { WorkbenchAgentDialog } from './pipeline/WorkbenchAgentDialog'
import { MobileWorkbenchContent } from './mobile/MobileWorkbenchContent'
import { useIsMobile } from '../../hooks/useIsMobile'

export function WorkbenchContent() {
  if (useIsMobile()) {
    return <MobileWorkbenchContent />
  }

  return (
    <div className="workbench-dashboard-layout">
      <div className="workbench-dashboard-layout__scroll workbench-dashboard-layout__scroll--fit">
        <FulfillmentPipeline />
      </div>
      <div className="workbench-dashboard-layout__dock">
        <WorkbenchRoleDock />
        <WorkbenchAgentDialog />
      </div>
    </div>
  )
}
