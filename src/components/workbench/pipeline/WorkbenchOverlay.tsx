import { useShortageStore } from '../../../store/shortageStore'
import { getTasksForFlowKind, TASK_FLOW_TITLES } from '../../../utils/shortageAggregations'
import { TaskFlowWorkspace } from './TaskFlowWorkspace'
import { OpsChatConversation } from './OpsChatConversation'
import { GeneratePoConfirm } from '../ops/GeneratePoConfirm'

const OVERLAY_TITLES: Record<string, string> = {
  ops_chat: '履约智能对话',
  ...TASK_FLOW_TITLES,
}

export function WorkbenchOverlay() {
  const overlayView = useShortageStore((s) => s.overlayView)
  const orders = useShortageStore((s) => s.orders)
  const closeOverlay = useShortageStore((s) => s.closeOverlay)

  if (!overlayView) return null

  const isOpsChat = overlayView === 'ops_chat'
  const tasks = isOpsChat ? [] : getTasksForFlowKind(orders, overlayView)
  const title = isOpsChat
    ? OVERLAY_TITLES[overlayView]
    : `${OVERLAY_TITLES[overlayView]}（剩余 ${tasks.length}）`

  return (
    <div className="workbench-overlay-panel" role="dialog" aria-modal="true">
      <header className="workbench-overlay-panel__header">
        <h3 className="workbench-overlay-panel__title">{title}</h3>
        <button
          type="button"
          className="btn-ghost workbench-overlay-panel__back"
          onClick={closeOverlay}
        >
          返回大盘
        </button>
      </header>
      <div
        className={`workbench-overlay-panel__body ${
          isOpsChat ? 'workbench-overlay-panel__body--chat' : 'workbench-overlay-panel__body--task'
        }`}
      >
        {isOpsChat ? (
          <OpsChatConversation />
        ) : (
          <TaskFlowWorkspace kind={overlayView} />
        )}
      </div>
      {!isOpsChat && <GeneratePoConfirm />}
    </div>
  )
}
