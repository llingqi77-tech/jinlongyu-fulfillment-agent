import { TabSwipeButton } from '../layout/TabSwipeButton'
import { useWorkflowStore } from '../../store/workflowStore'
import { SystemPhoneFrame } from './SystemPhoneFrame'
import { OrderSystemScreen } from './OrderSystemScreen'
import { InventorySystemScreen } from './InventorySystemScreen'
import { PurchaseSystemScreen } from './PurchaseSystemScreen'
import { TrackingSystemTabs } from './TrackingSystemTabs'
import { TrackingTimeline } from './TrackingTimeline'

const SYSTEM_TITLES = {
  order: '金龙鱼订单管理系统',
  inventory: '金龙鱼库存管理系统',
  purchase: '金龙鱼采购管理系统',
} as const

export function TrackingView() {
  const trackingSystem = useWorkflowStore((s) => s.trackingSystem)
  const phase = useWorkflowStore((s) => s.phase)

  const defaultSystem =
    phase === 'creatingPO' || phase === 'completed'
      ? 'purchase'
      : phase === 'matchingInventory' || phase === 'shortageWait'
        ? 'inventory'
        : 'order'

  const activeSystem = trackingSystem || defaultSystem

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <SystemPhoneFrame systemTitle={SYSTEM_TITLES[activeSystem]}>
        <TrackingSystemTabs />
        {activeSystem === 'order' && <OrderSystemScreen />}
        {activeSystem === 'inventory' && <InventorySystemScreen />}
        {activeSystem === 'purchase' && <PurchaseSystemScreen />}
      </SystemPhoneFrame>
      <TrackingTimeline />
      <TabSwipeButton direction="toChat" />
    </div>
  )
}
