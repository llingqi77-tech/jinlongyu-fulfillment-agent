import { ErpBackground } from './components/erp/ErpBackground'
import { AgentFab } from './components/erp/AgentFab'
import { WorkbenchModal } from './components/workbench/WorkbenchModal'
import { WorkbenchShell } from './components/workbench/WorkbenchShell'

function App() {
  return (
    <>
      <ErpBackground />
      <AgentFab />
      <WorkbenchModal>
        <WorkbenchShell />
      </WorkbenchModal>
    </>
  )
}

export default App
