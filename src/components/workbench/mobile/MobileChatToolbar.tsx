import { useShortageStore } from '../../../store/shortageStore'

export function MobileChatToolbar() {
  const openDashboard = useShortageStore((s) => s.openMobileDashboardSheet)
  const openTaskList = useShortageStore((s) => s.openMobileTaskListSheet)

  return (
    <div className="mobile-chat-toolbar">
      <button
        type="button"
        className="mobile-chat-toolbar__btn"
        onClick={openDashboard}
        aria-label="看板数据"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 19V5M10 19V9M16 19V13M22 19V3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="mobile-chat-toolbar__btn"
        onClick={openTaskList}
        aria-label="任务清单"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
