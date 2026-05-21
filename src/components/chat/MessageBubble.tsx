import type { ReactNode } from 'react'
import { NEW_SESSION_MARKER } from '../../constants/session'
import type { ChatMessage } from '../../types/workflow'
import { ChatAvatar } from './ChatAvatar'
import { ExecutionCard } from './ExecutionCard'
import { PendingOrderCard } from './PendingOrderCard'
import { ShortageTable } from './ShortageTable'
import { ActionButton } from './ActionButton'
import { useWorkflowStore } from '../../store/workflowStore'
import { useWorkflowActions } from '../../hooks/useWorkflowActions'

interface MessageBubbleProps {
  message: ChatMessage
  showConfirmSales: boolean
  showGeneratePO: boolean
  dimmed?: boolean
}

function AgentRow({
  children,
  dimmed,
}: {
  children: ReactNode
  dimmed?: boolean
}) {
  return (
    <div className={`flex items-start gap-2.5 ${dimmed ? 'opacity-45' : ''}`}>
      <ChatAvatar role="agent" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function UserRow({
  content,
  dimmed,
}: {
  content: string
  dimmed?: boolean
}) {
  return (
    <div className={`flex w-full min-w-0 justify-end ${dimmed ? 'opacity-45' : ''}`}>
      <div className="flex min-w-0 max-w-[85%] items-start gap-2.5">
        <div className="min-w-0 flex-1 break-words rounded-bubble bg-[var(--color-chat-bubble-user)] px-3.5 py-2.5 text-[15px] text-paper-canvas [overflow-wrap:anywhere]">
          {content}
        </div>
        <ChatAvatar role="user" />
      </div>
    </div>
  )
}

export function MessageBubble({
  message,
  showConfirmSales,
  showGeneratePO,
  dimmed,
}: MessageBubbleProps) {
  const phase = useWorkflowStore((s) => s.phase)
  const { handleConfirmSales, openPurchaseModal } = useWorkflowActions()

  if (message.content === NEW_SESSION_MARKER) {
    return (
      <div className="py-4">
        <div className="h-px w-full bg-[var(--color-chat-primary-light)]" />
        <p className="mt-2 text-center text-xs text-faint-text">
          {NEW_SESSION_MARKER}
        </p>
      </div>
    )
  }

  if (message.kind === 'user') {
    return <UserRow content={message.content ?? ''} dimmed={dimmed} />
  }

  if (message.kind === 'system') {
    if (message.content === '任务中止') {
      return (
        <AgentRow dimmed={dimmed}>
          <p className="text-sm text-muted">🚫 {message.content}</p>
        </AgentRow>
      )
    }
    return (
      <AgentRow dimmed={dimmed}>
        <p className="break-words rounded-bubble border border-[var(--color-chat-bubble-agent-border)] bg-[var(--color-chat-bubble-agent)] px-3.5 py-2.5 text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">
          {message.content}
        </p>
      </AgentRow>
    )
  }

  if (message.kind === 'execution') {
    return (
      <AgentRow dimmed={dimmed}>
        <ExecutionCard
          steps={message.executionSteps}
          streaming={message.executionStreaming}
        />
      </AgentRow>
    )
  }

  if (message.kind === 'pending_order' && message.pendingOrder) {
    return (
      <AgentRow dimmed={dimmed}>
        <PendingOrderCard order={message.pendingOrder} />
      </AgentRow>
    )
  }

  if (message.kind === 'shortage_table' && message.shortageLines) {
    return (
      <AgentRow dimmed={dimmed}>
        <ShortageTable lines={message.shortageLines} />
      </AgentRow>
    )
  }

  if (message.kind === 'action') {
    if (message.actionType === 'confirm_sales' && showConfirmSales && phase === 'pendingReview') {
      return (
        <AgentRow dimmed={dimmed}>
          <ActionButton
            label={message.content ?? '确认，并转为销售订单'}
            onClick={handleConfirmSales}
          />
        </AgentRow>
      )
    }
    if (message.actionType === 'generate_po' && showGeneratePO && phase === 'shortageWait') {
      return (
        <AgentRow dimmed={dimmed}>
          <ActionButton
            label={message.content ?? '采购订单生成'}
            onClick={openPurchaseModal}
          />
        </AgentRow>
      )
    }
    return null
  }

  return null
}
