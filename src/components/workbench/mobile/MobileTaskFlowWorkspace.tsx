import { useEffect, useMemo } from 'react'
import type { TaskFlowKind } from '../../../types/shortage'
import { useShortageStore } from '../../../store/shortageStore'
import { getTasksForFlowKind } from '../../../utils/shortageAggregations'
import { renderTaskForm } from '../pipeline/renderTaskForm'
import { OverlayBottomComposer } from '../pipeline/OverlayBottomComposer'
import { WorkbenchRoleDock } from '../pipeline/WorkbenchRoleDock'

export function MobileTaskFlowWorkspace({ kind }: { kind: TaskFlowKind }) {
  const role = useShortageStore((s) => s.role)
  const orders = useShortageStore((s) => s.orders)
  const selectedTaskLineId = useShortageStore((s) => s.selectedTaskLineId)
  const selectTaskLine = useShortageStore((s) => s.selectTaskLine)
  const checkTaskFlowComplete = useShortageStore((s) => s.checkTaskFlowComplete)

  const tasks = useMemo(() => getTasksForFlowKind(orders, kind), [orders, kind])

  useEffect(() => {
    if (tasks.length === 0) {
      if (selectedTaskLineId) selectTaskLine(null)
      checkTaskFlowComplete()
      return
    }
    // 仅当选中项失效时回退到第一项；允许全部为收起（null）
    if (
      selectedTaskLineId &&
      !tasks.some((t) => t.lineId === selectedTaskLineId)
    ) {
      selectTaskLine(tasks[0].lineId)
    }
  }, [tasks, selectedTaskLineId, selectTaskLine, checkTaskFlowComplete])

  return (
    <div className="mobile-task-workspace">
      <div className="mobile-task-scroll">
        {tasks.length === 0 ? (
          <p className="pipeline-task-page__empty">当前无待办任务</p>
        ) : (
          <ul className="mobile-task-list">
            {tasks.map((task) => {
              const open = selectedTaskLineId === task.lineId
              return (
                <li
                  key={task.id}
                  className={`mobile-task-item ${open ? 'mobile-task-item--open' : ''}`}
                >
                  <button
                    type="button"
                    className="mobile-task-item__head"
                    aria-expanded={open}
                    onClick={() => selectTaskLine(open ? null : task.lineId)}
                  >
                    <span className="mobile-task-item__chevron" aria-hidden>
                      ▶
                    </span>
                    <span className="mobile-task-item__text">
                      <span className="mobile-task-item__title">{task.title}</span>
                    </span>
                  </button>
                  {open && (
                    <div className="mobile-task-item__body">{renderTaskForm(kind, task.lineId)}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="mobile-task-dock">
        {role === 'procurement' && (
          <WorkbenchRoleDock variant="overlay" activeKind={kind} />
        )}
        <OverlayBottomComposer placeholder="输入处理意向" />
      </div>
    </div>
  )
}
