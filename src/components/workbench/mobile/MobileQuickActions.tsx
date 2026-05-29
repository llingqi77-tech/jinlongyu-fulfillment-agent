import { sendMobileAgentMessage, startMobileTaskByIndex } from '../../../utils/mobileAgentDialogue'
import { getMobileQuickActions } from '../../../utils/mobileQuickActions'
import { useShortageStore } from '../../../store/shortageStore'

export function MobileQuickActions() {
  const role = useShortageStore((s) => s.role)
  const actions = getMobileQuickActions(role)

  return (
    <div className="mobile-quick-actions" role="group" aria-label="快捷操作">
      <div className="mobile-quick-actions__scroll">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="mobile-quick-actions__chip"
            onClick={() => {
              if (action.kind === 'start_first_task') {
                startMobileTaskByIndex(1)
              } else if (action.kind === 'open_task_list') {
                useShortageStore.getState().openMobileTaskListSheet()
              } else if (action.message) {
                sendMobileAgentMessage(action.message)
              }
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
