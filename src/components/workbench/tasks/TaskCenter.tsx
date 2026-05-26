import { useEffect, useMemo } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { getTasksForRole } from '../../../utils/shortageAggregations'
import { OpsFulfillmentTask } from './OpsFulfillmentTask'
import { SalesFulfillmentForm } from './SalesFulfillmentForm'
import { ProcurementSkuTask } from './ProcurementSkuTask'
import { LogisticsSignoffPanel } from './LogisticsSignoffPanel'
import { GeneratePoConfirm } from '../ops/GeneratePoConfirm'

const ROLE_TASK_TITLE = {
  ops: '运营任务',
  sales: '销售任务',
  procurement: '采购任务',
} as const

export function TaskCenter() {
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
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

  return (
    <section id="workbench-task-panel" className="task-panel workbench-section">
      <div className="workbench-section__header">
        <h2 className="workbench-section__title">{ROLE_TASK_TITLE[role]}</h2>
      </div>

      <div className="grid min-h-[360px] grid-cols-1 gap-6 lg:grid-cols-5">
        <ul className="space-y-2 lg:col-span-2">
          {tasks.length === 0 ? (
            <li className="task-empty">当前角色暂无待办</li>
          ) : (
            tasks.map((task) => {
              const active = selected?.lineId === task.lineId
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => selectTaskLine(task.lineId)}
                    className={`task-list-item ${active ? 'task-list-item--active' : ''}`}
                  >
                    <p className="task-list-item__title">{task.title}</p>
                    <p className="task-list-item__sub">{task.sub}</p>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="space-y-4">
              {role === 'ops' && <OpsFulfillmentTask lineId={selected.lineId} />}
              {role === 'sales' && <SalesFulfillmentForm lineId={selected.lineId} />}
              {role === 'procurement' && <ProcurementSkuTask lineId={selected.lineId} />}
              <LogisticsSignoffPanel lineId={selected.lineId} />
            </div>
          ) : (
            <div className="task-detail-placeholder">从左侧选择任务开始处理</div>
          )}
        </div>
      </div>

      <GeneratePoConfirm />
    </section>
  )
}
