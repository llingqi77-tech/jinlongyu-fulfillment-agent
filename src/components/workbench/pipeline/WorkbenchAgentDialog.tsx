import { useState } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { AgentComposer } from '../shared/AgentComposer'

export function WorkbenchAgentDialog() {
  const role = useShortageStore((s) => s.role)
  const pushActivity = useShortageStore((s) => s.pushActivity)
  const openOverlay = useShortageStore((s) => s.openOverlay)
  const [input, setInput] = useState('')

  const send = () => {
    const text = input.trim()
    if (!text) return
    pushActivity({ actor: '我', type: 'system', content: text })
    setInput('')
    if (role === 'ops') {
      openOverlay('ops_chat')
    }
  }

  return (
    <AgentComposer
      value={input}
      onChange={setInput}
      onSend={send}
      placeholder={
        role === 'ops'
          ? '向履约 Agent 提问，发送后进入对话…'
          : '输入消息（演示，任务请点上方按钮）…'
      }
    />
  )
}
