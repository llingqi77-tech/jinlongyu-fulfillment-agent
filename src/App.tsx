import { useEffect } from 'react'
import { ErpBackground } from './components/erp/ErpBackground'
import { AgentFab } from './components/erp/AgentFab'
import { WorkbenchModal } from './components/workbench/WorkbenchModal'
import { WorkbenchShell } from './components/workbench/WorkbenchShell'
import { syncPlatformMobileClass, useIsMobile } from './hooks/useIsMobile'
import { useShortageStore } from './store/shortageStore'

// #region agent log
const debugLog = (
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) => {
  fetch('http://127.0.0.1:7854/ingest/c358ecd3-74fd-4ab3-aafb-d866601ca064', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6df2ca' },
    body: JSON.stringify({
      sessionId: '6df2ca',
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
      runId: 'pre-fix',
    }),
  }).catch(() => {})
}
// #endregion

function App() {
  const isMobile = useIsMobile()
  const workbenchOpen = useShortageStore((s) => s.workbenchOpen)
  const openWorkbench = useShortageStore((s) => s.openWorkbench)

  useEffect(() => {
    syncPlatformMobileClass(isMobile)
  }, [isMobile])

  useEffect(() => {
    if (isMobile && !workbenchOpen) {
      openWorkbench()
    }
  }, [isMobile, workbenchOpen, openWorkbench])

  useEffect(() => {
    const erpEl = document.querySelector('.erp-background')
    const fabEl = document.querySelector('.agent-fab')
    const erpStyle = erpEl ? getComputedStyle(erpEl) : null
    const fabStyle = fabEl ? getComputedStyle(fabEl) : null
    // #region agent log
    debugLog(
      'App.tsx:layout',
      'app layout snapshot',
      {
        isMobile,
        workbenchOpen,
        innerWidth: window.innerWidth,
        platformMobileClass: document.documentElement.classList.contains('platform-mobile'),
        erpDisplay: erpStyle?.display ?? 'missing',
        erpVisibility: erpStyle?.visibility ?? 'missing',
        fabDisplay: fabStyle?.display ?? 'missing',
        rootChildCount: document.getElementById('root')?.childElementCount ?? 0,
      },
      'A'
    )
    // #endregion
  }, [isMobile, workbenchOpen])

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
