import { MobileAgentComposer } from './MobileAgentComposer'
import { MobileAgentThread } from './MobileAgentThread'
import { MobileDashboardSheet } from './MobileDashboardSheet'
import { MobileQuickActions } from './MobileQuickActions'
import { MobilePipelineStageSheet } from './MobilePipelineStageSheet'
import { MobileTaskListSheet } from './MobileTaskListSheet'

export function MobileAgentHome() {
  return (
    <div className="mobile-chat-page">
      <MobileAgentThread />
      <footer className="mobile-chat-footer">
        <MobileQuickActions />
        <MobileAgentComposer />
      </footer>
      <MobileDashboardSheet />
      <MobileTaskListSheet />
      <MobilePipelineStageSheet />
    </div>
  )
}
