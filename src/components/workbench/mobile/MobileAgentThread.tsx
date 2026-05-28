import { useEffect, useRef, useState } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { ChatMessageRow } from '../shared/ChatMessageRow'
import { MobileChatMessageLayout } from './MobileChatMessageLayout'
import { MobileWelcomeCardMessage } from './MobileWelcomeCardMessage'

export function MobileAgentThread() {
  const messages = useShortageStore((s) => s.mobileChatMessages)
  const threadRef = useRef<HTMLDivElement>(null)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const prevCountRef = useRef(0)

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, streamingId])

  useEffect(() => {
    if (messages.length <= prevCountRef.current) {
      prevCountRef.current = messages.length
      return
    }
    const added = messages.slice(prevCountRef.current)
    prevCountRef.current = messages.length
    const lastAgent = [...added].reverse().find((m) => m.side === 'agent')
    if (lastAgent) setStreamingId(lastAgent.id)
  }, [messages])

  return (
    <div className="mobile-chat-thread" ref={threadRef}>
      {messages.map((msg) => {
        if (msg.kind === 'welcome_card' && msg.side === 'agent') {
          return (
            <MobileChatMessageLayout
              key={msg.id}
              side="agent"
              time={msg.timestamp}
              bodyClassName="chat-message__body--card"
            >
              <MobileWelcomeCardMessage meta={msg.meta} />
            </MobileChatMessageLayout>
          )
        }

        const isUser = msg.side === 'user'
        return (
          <ChatMessageRow
            key={msg.id}
            side={isUser ? 'user' : 'agent'}
            name=""
            showName={false}
            time={msg.timestamp}
            content={msg.content}
            stream={!isUser && msg.id === streamingId && msg.kind !== 'welcome_card'}
            onStreamComplete={() => {
              if (msg.id === streamingId) setStreamingId(null)
            }}
          />
        )
      })}
    </div>
  )
}
