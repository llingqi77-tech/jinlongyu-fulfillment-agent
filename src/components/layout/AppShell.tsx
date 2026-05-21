import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { ChatInputBar } from '../input/ChatInputBar'
import { useWorkflowStore } from '../../store/workflowStore'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const activeTab = useWorkflowStore((s) => s.activeTab)

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--color-chat-bg)]">
      <TopBar />
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
      {activeTab === 'chat' && <ChatInputBar />}
    </div>
  )
}
