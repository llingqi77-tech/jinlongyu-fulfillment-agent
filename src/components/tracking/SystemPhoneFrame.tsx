import type { ReactNode } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'

interface SystemPhoneFrameProps {
  systemTitle: string
  children: ReactNode
}

export function SystemPhoneFrame({ systemTitle, children }: SystemPhoneFrameProps) {
  const trackingReady = useWorkflowStore((s) => s.trackingReady)
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)
  const statusText = useWorkflowStore((s) => s.trackingScreen.statusText)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col px-2 pb-0 pt-1">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-pale-stone/20 bg-paper-canvas shadow-soft">
        <div className="flex items-center gap-2 border-b border-pale-stone/20 bg-atmosphere-wash/40 px-3 py-2">
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28CA42]" />
          </div>
          <span className="flex-1 truncate text-center text-[11px] font-medium text-ink">
            {systemTitle}
          </span>
          <span className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                isAgentRunning ? 'animate-pulse bg-accent' : trackingReady ? 'bg-accent' : 'bg-muted'
              }`}
            />
            <span className="text-[10px] font-medium text-muted">
              {isAgentRunning ? '操作中' : trackingReady ? '已就绪' : '连接中'}
            </span>
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <div className="shrink-0 border-t border-pale-stone/20 bg-paper-canvas px-3 py-1.5">
          <p className="truncate text-[10px] text-muted">{statusText}</p>
        </div>
      </div>
    </div>
  )
}
