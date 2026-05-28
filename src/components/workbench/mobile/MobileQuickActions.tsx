import { sendMobileAgentMessage } from '../../../utils/mobileAgentDialogue'
import { useShortageStore } from '../../../store/shortageStore'

const ACTIONS = [
  {
    id: 'start',
    label: '处理第 1 项待办',
    onClick: () => sendMobileAgentMessage('我想先完成第 1 个任务'),
  },
  {
    id: 'list',
    label: '查看任务数据',
    onClick: () => useShortageStore.getState().openMobileTaskListSheet(),
  },
  {
    id: 'shortage',
    label: '今日缺货',
    onClick: () => sendMobileAgentMessage('今天缺货数据有多少？'),
  },
  {
    id: 'urgent',
    label: '最紧急任务',
    onClick: () => sendMobileAgentMessage('哪些任务最紧急？'),
  },
  {
    id: 'done',
    label: '已履约多少',
    onClick: () => sendMobileAgentMessage('今天已履约完成了多少？'),
  },
] as const

export function MobileQuickActions() {
  return (
    <div className="mobile-quick-actions" role="group" aria-label="快捷操作">
      <div className="mobile-quick-actions__scroll">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            className="mobile-quick-actions__chip"
            onClick={a.onClick}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
