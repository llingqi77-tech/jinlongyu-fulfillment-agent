import { useShortageStore } from '../../store/shortageStore'
import { ShortagePoList } from './po/ShortagePoList'
import { ShortagePoDetail } from './po/ShortagePoDetail'
import { SkuSourcingList } from './procurement/SkuSourcingList'
import { HotelList } from './sales/HotelList'
import { HotelDetail } from './sales/HotelDetail'
import { TaskInbox } from './tasks/TaskInbox'
import { SupplyPlanDialog } from './procurement/SupplyPlanDialog'
import { GeneratePoConfirm } from './ops/GeneratePoConfirm'
function RoleHomePanel() {
  const role = useShortageStore((s) => s.role)
  const selectedPoId = useShortageStore((s) => s.selectedPoId)
  const selectedHotel = useShortageStore((s) => s.selectedHotel)

  if (selectedPoId) {
    return (
      <>
        <ShortagePoDetail poId={selectedPoId} />
        {role === 'ops' && <GeneratePoConfirm />}
      </>
    )
  }

  if (role === 'ops') {
    return (
      <>
        <ShortagePoList />
        <GeneratePoConfirm />
      </>
    )
  }
  if (role === 'procurement') {
    return (
      <>
        <SkuSourcingList />
        <SupplyPlanDialog />
      </>
    )
  }
  return selectedHotel ? <HotelDetail hotelKey={selectedHotel} /> : <HotelList />
}

export function WorkbenchContent() {
  const nav = useShortageStore((s) => s.nav)

  if (nav === 'tasks') return <TaskInbox />
  return <RoleHomePanel />
}
