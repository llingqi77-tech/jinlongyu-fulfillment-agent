import type { ReactNode } from 'react'
import { useShortageStore } from '../../store/shortageStore'

export function WorkbenchModal({ children }: { children: ReactNode }) {
  const open = useShortageStore((s) => s.workbenchOpen)
  const closeWorkbench = useShortageStore((s) => s.closeWorkbench)
  const toast = useShortageStore((s) => s.toast)

  if (!open) return null

  return (
    <div className="workbench-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="workbench-modal relative flex h-[90vh] w-[92vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-paper-canvas shadow-md">
        {toast && (
          <div className="absolute left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full bg-off-black px-4 py-2 text-xs font-medium text-paper-canvas shadow-soft">
            {toast}
          </div>
        )}
        {children}
      </div>
      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="关闭"
        onClick={closeWorkbench}
      />
    </div>
  )
}
