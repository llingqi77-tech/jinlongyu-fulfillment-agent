import { FulfillmentPipeline } from './pipeline/FulfillmentPipeline'
import { WorkbenchRoleDock } from './pipeline/WorkbenchRoleDock'
import { WorkbenchAgentDialog } from './pipeline/WorkbenchAgentDialog'

export function WorkbenchContent() {
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
