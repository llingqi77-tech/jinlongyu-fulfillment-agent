import { useEffect, useMemo } from 'react'
import type { WorkbenchRole } from '../../../types/shortage'
import { useShortageStore } from '../../../store/shortageStore'
import { getTasksForRole } from '../../../utils/shortageAggregations'
import { OpsFulfillmentTask } from '../tasks/OpsFulfillmentTask'
import { SalesFulfillmentForm } from '../tasks/SalesFulfillmentForm'
import { ProcurementSkuTask } from '../tasks/ProcurementSkuTask'

export function PipelineColumnTaskPanel({ role }: { role: WorkbenchRole }) {
  const orders = useShortageStore((s) => s.orders)
  const selectedTaskLineId = useShortageStore((s) => s.selectedTaskLineId)
  const selectTaskLine = useShortageStore((s) => s.selectTaskLine)

  const tasks = useMemo(() => getTasksForRole(orders, role), [orders, role])

  const selected =
    tasks.find((t) => t.lineId === selectedTaskLineId) ??
    (tasks.length > 0 ? tasks[0] : undefined)

  useEffect(() => {
    if (tasks.length === 0) {
      if (selectedTaskLineId) selectTaskLine(null)
      return
    }
    if (!selectedTaskLineId || !tasks.some((t) => t.lineId === selectedTaskLineId)) {
      selectTaskLine(tasks[0].lineId)
    }
  }, [tasks, selectedTaskLineId, selectTaskLine])

  if (tasks.length === 0) {
    return <p className="pipeline-task-page__empty">当前暂无待办任务</p>
  }

  return (
    <div className="pipeline-task-page__layout pipeline-task-page__layout--with-sidebar">
      <aside className="pipeline-task-page__sidebar">
        <p className="pipeline-task-page__sidebar-title">待办列表</p>
        <ul className="pipeline-task-page__task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => selectTaskLine(task.lineId)}
                className={`pipeline-task-page__task-pick ${
                  selected?.lineId === task.lineId ? 'pipeline-task-page__task-pick--active' : ''
                }`}
              >
                <span className="font-medium">{task.title}</span>
                <span className="mt-1 block text-caption text-muted">{task.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="pipeline-task-page__main">
        {selected && (
          <>
            {role === 'ops' && <OpsFulfillmentTask lineId={selected.lineId} />}
            {role === 'sales' && <SalesFulfillmentForm lineId={selected.lineId} />}
            {role === 'procurement' && <ProcurementSkuTask lineId={selected.lineId} />}
          </>
        )}
      </div>
    </div>
  )
}
