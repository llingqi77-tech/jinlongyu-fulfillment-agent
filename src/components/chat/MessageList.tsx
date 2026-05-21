import { useEffect, useRef } from 'react'
import { NEW_SESSION_MARKER } from '../../constants/session'
import { useWorkflowStore } from '../../store/workflowStore'
import { setChatScrollBottom } from '../../utils/chatScroll'
import { MessageBubble } from './MessageBubble'
import { WelcomeHero } from './WelcomeHero'
import { EmptySessionHint } from './EmptySessionHint'

function lastDividerIndex(messages: { content?: string }[]) {
  let idx = -1
  messages.forEach((m, i) => {
    if (m.content === NEW_SESSION_MARKER) idx = i
  })
  return idx
}

function sessionHasConversation(
  messages: ReturnType<typeof useWorkflowStore.getState>['messages'],
  sessionStart: number
) {
  return messages
    .slice(sessionStart)
    .some((m) => !m.id.startsWith('welcome') && m.content !== NEW_SESSION_MARKER)
}

function isFirstVisit(messages: ReturnType<typeof useWorkflowStore.getState>['messages']) {
  return messages.length === 1 && messages[0]?.id === 'welcome'
}

export function MessageList() {
  const messages = useWorkflowStore((s) => s.messages)
  const phase = useWorkflowStore((s) => s.phase)
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const bindBottomRef = (el: HTMLDivElement | null) => {
    bottomRef.current = el
    setChatScrollBottom(el)
  }

  const dividerIdx = lastDividerIndex(messages)
  const sessionStart = dividerIdx + 1
  const hasConversationStarted = sessionHasConversation(messages, sessionStart)
  const firstVisit = isFirstVisit(messages)

  let lastConfirmIdx = -1
  let lastShortageIdx = -1
  messages.forEach((m, i) => {
    if (i >= sessionStart && m.kind === 'action' && m.actionType === 'confirm_sales') {
      lastConfirmIdx = i
    }
    if (i >= sessionStart && m.kind === 'shortage_table') lastShortageIdx = i
  })

  const visibleMessages = messages.filter((m) => !m.id.startsWith('welcome'))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, phase, hasConversationStarted, isAgentRunning])

  if (firstVisit) {
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <WelcomeHero />
        <div ref={bindBottomRef} />
      </div>
    )
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto px-3 py-2">
      {visibleMessages.map((msg) => {
        const index = messages.indexOf(msg)
        const inCurrentSession = index >= sessionStart

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            showConfirmSales={
              inCurrentSession &&
              msg.kind === 'action' &&
              msg.actionType === 'confirm_sales' &&
              index === lastConfirmIdx
            }
            showGeneratePO={
              inCurrentSession &&
              msg.kind === 'action' &&
              msg.actionType === 'generate_po' &&
              index === lastShortageIdx + 1
            }
            dimmed={
              msg.content !== NEW_SESSION_MARKER && !inCurrentSession
            }
          />
        )
      })}

      {!hasConversationStarted && <EmptySessionHint />}

      <div ref={bindBottomRef} />
    </div>
  )
}
