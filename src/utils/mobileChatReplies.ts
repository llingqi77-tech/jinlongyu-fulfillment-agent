import type { MobileChatAction } from '../types/shortage'
import type { ShortageState } from '../store/shortageStore'

export type AgentDialogueReply = {
  text: string
  actions?: MobileChatAction[]
}

export const CHAT_ACTION_SUBMIT_OA: MobileChatAction = {
  id: 'submit_oa',
  label: '提交 OA 审批',
  message: '提交 OA 审批',
}

export const CHAT_ACTION_SUBMIT_PO: MobileChatAction = {
  id: 'submit_po',
  label: '提交采购订单',
  message: '提交采购订单',
}

export function appendAgentReply(
  store: ShortageState,
  reply: string | AgentDialogueReply,
  stream = true
) {
  if (typeof reply === 'string') {
    store.appendMobileChat({ side: 'agent', content: reply, stream })
    return
  }
  store.appendMobileChat({
    side: 'agent',
    content: reply.text,
    stream,
    meta: reply.actions?.length ? { actions: reply.actions } : undefined,
  })
}

export function appendAgentReplies(
  store: ShortageState,
  replies: Array<string | AgentDialogueReply>
) {
  for (const reply of replies) {
    appendAgentReply(store, reply)
  }
}
