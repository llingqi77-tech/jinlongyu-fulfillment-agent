import { AppShell } from './components/layout/AppShell'
import { SwipePages } from './components/layout/SwipePages'
import { PurchaseOrderModal } from './components/modals/PurchaseOrderModal'

function App() {
  return (
    <AppShell>
      <SwipePages />
      <PurchaseOrderModal />
    </AppShell>
  )
}

export default App
