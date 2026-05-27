import { useEffect, useMemo } from 'react'
import type { TaskFlowKind } from '../../../types/shortage'
import { useShortageStore } from '../../../store/shortageStore'
import { getTasksForFlowKind } from '../../../utils/shortageAggregations'
import { renderTaskForm } from './renderTaskForm'
import { OverlayBottomComposer } from './OverlayBottomComposer'
import { WorkbenchRoleDock } from './WorkbenchRoleDock'
import { MobileTaskFlowWorkspace } from '../mobile/MobileTaskFlowWorkspace'
import { useIsMobile } from '../../../hooks/useIsMobile'

function DesktopTaskFlowWorkspace({ kind }: { kind: TaskFlowKind }) {
  const role = useShortageStore((s) => s.role)
  const orders = useShortageStore((s) => s.orders)
  const selectedTaskLineId = useShortageStore((s) => s.selectedTaskLineId)
  const selectTaskLine = useShortageStore((s) => s.selectTaskLine)
  const checkTaskFlowComplete = useShortageStore((s) => s.checkTaskFlowComplete)

  const tasks = useMemo(() => getTasksForFlowKind(orders, kind), [orders, kind])

  const selected =
    tasks.find((t) => t.lineId === selectedTaskLineId) ??
    (tasks.length > 0 ? tasks[0] : undefined)

  useEffect(() => {
    if (tasks.length === 0) {
      if (selectedTaskLineId) selectTaskLine(null)
      checkTaskFlowComplete()
      return
    }
    if (!selectedTaskLineId || !tasks.some((t) => t.lineId === selectedTaskLineId)) {
      selectTaskLine(tasks[0].lineId)
    }
  }, [tasks, selectedTaskLineId, selectTaskLine, checkTaskFlowComplete])

  return (
    <div className="task-flow-workspace">
      <div className="task-flow-workspace__content">
        {tasks.length === 0 ? (
          <p className="pipeline-task-page__empty">当前无待办任务</p>
        ) : (
          <div className="pipeline-task-page__layout pipeline-task-page__layout--with-sidebar">
            <aside className="pipeline-task-page__sidebar">
              <p className="pipeline-task-page__sidebar-title">任务列表（{tasks.length}）</p>
              <ul className="pipeline-task-page__task-list">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => selectTaskLine(task.lineId)}
                      className={`pipeline-task-page__task-pick ${
                        selected?.lineId === task.lineId
                          ? 'pipeline-task-page__task-pick--active'
                          : ''
                      }`}
                    >
                      <span className="font-medium">{task.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="pipeline-task-page__main">
              {selected ? (
                renderTaskForm(kind, selected.lineId)
              ) : (
                <p className="text-body-sm text-muted">从左侧选择任务</p>
              )}
            </div>
          </div>
        )}
      </div>
      {role === 'procurement' && (
        <WorkbenchRoleDock variant="overlay" activeKind={kind} />
      )}
      <OverlayBottomComposer placeholder="输入处理意向" />
    </div>
  )
}

export function TaskFlowWorkspace({ kind }: { kind: TaskFlowKind }) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <MobileTaskFlowWorkspace kind={kind} />
  }
  return <DesktopTaskFlowWorkspace kind={kind} />
}
