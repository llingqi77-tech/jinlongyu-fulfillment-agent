import { NEW_SESSION_MARKER } from '../../constants/session'
import { useWorkflowStore } from '../../store/workflowStore'
import { scrollChatToBottom } from '../../utils/chatScroll'

export function ScrollToBottomButton() {
  const hasChat = useWorkflowStore((s) =>
    s.messages.some((m) => !m.id.startsWith('welcome') && m.content !== NEW_SESSION_MARKER)
  )

  if (!hasChat) return null

  return (
    <div className="mb-1.5 flex justify-center">
      <button
        type="button"
        onClick={scrollChatToBottom}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-chat-primary-light)] bg-card text-[var(--color-chat-primary)] shadow-soft active:opacity-80"
        aria-label="滚动到最新消息"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
