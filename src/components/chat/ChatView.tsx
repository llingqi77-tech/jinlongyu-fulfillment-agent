import { TabSwipeButton } from '../layout/TabSwipeButton'
import { MessageList } from './MessageList'

export function ChatView() {
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-chat-bg)]">
      <MessageList />
      <TabSwipeButton direction="toTracking" />
    </div>
  )
}
