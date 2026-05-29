import type { MobileChatMessageMeta } from '../../../types/shortage'
import { useShortageStore } from '../../../store/shortageStore'
import { startMobileTaskByIndex, startMobileTaskInChat } from '../../../utils/mobileAgentDialogue'
import { MobileHomeTaskList } from './MobileHomeTaskList'

type MobileWelcomeCardMessageProps = {
  meta?: MobileChatMessageMeta
}

export function MobileWelcomeCardMessage({ meta }: MobileWelcomeCardMessageProps) {
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
        {tasks.length > 0 ? (
          <MobileHomeTaskList
            tasks={tasks}
            maxVisible={3}
            onSelectTask={startMobileTaskInChat}
            onViewMore={() => useShortageStore.getState().openMobileTaskListSheet()}
          />
        ) : null}
        <button
          type="button"
          className="mobile-welcome-card__cta"
          onClick={() => startMobileTaskByIndex(1)}
        >
          开始完成任务。
        </button>
      </div>
    </div>
  )
}
