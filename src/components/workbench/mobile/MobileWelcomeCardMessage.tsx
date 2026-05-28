import type { MobileChatMessageMeta } from '../../../types/shortage'
import { useShortageStore } from '../../../store/shortageStore'
import { sendMobileAgentMessage } from '../../../utils/mobileAgentDialogue'
import { MobileHomeKpiStrip } from './MobileHomeKpiStrip'
import { MobileHomeTaskList } from './MobileHomeTaskList'

type MobileWelcomeCardMessageProps = {
  meta?: MobileChatMessageMeta
}

export function MobileWelcomeCardMessage({ meta }: MobileWelcomeCardMessageProps) {
  const kpis = meta?.kpis
  const tasks = meta?.tasks ?? []

  return (
    <div className="mobile-welcome-card">
      <div className="mobile-welcome-card__banner">
        <span>今日任务清单已梳理好。</span>
        <span className="mobile-welcome-card__check" aria-hidden>
          ✓
        </span>
      </div>
      <div className="mobile-welcome-card__body">
        <p className="mobile-welcome-card__intro">我来帮你整理成一份清单：</p>
        <ul className="mobile-welcome-card__bullets">
          <li>
            <span aria-hidden>🧭</span>
            {kpis ? `${kpis.pendingTaskCount} 件要做：按交期优先级排好` : '待办任务按交期排好'}
          </li>
          <li>
            <span aria-hidden>✨</span>
            {kpis
              ? `${kpis.shortageLineCount} 个缺货品 · 已履约 ${kpis.fulfilledCount} 个品`
              : '缺货与履约数据一眼看明白'}
          </li>
        </ul>
        <MobileHomeKpiStrip />
        {tasks.length > 0 ? (
          <>
            <h3 className="mobile-welcome-card__list-title">今日任务清单</h3>
            <MobileHomeTaskList
              tasks={tasks}
              maxVisible={3}
              onSelectTask={sendMobileAgentMessage}
              onViewMore={() => useShortageStore.getState().openMobileTaskListSheet()}
            />
          </>
        ) : null}
        <button
          type="button"
          className="mobile-welcome-card__cta"
          onClick={() => sendMobileAgentMessage('我想先完成第 1 个任务')}
        >
          开始完成任务。
        </button>
      </div>
    </div>
  )
}
