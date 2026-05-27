import { useMemo } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { getTasksForFlowKind } from '../../../utils/shortageAggregations'
import type { TaskFlowKind } from '../../../types/shortage'

type WorkbenchRoleDockProps = {
  variant?: 'dock' | 'overlay'
  activeKind?: TaskFlowKind
}

export function WorkbenchRoleDock({ variant = 'dock', activeKind }: WorkbenchRoleDockProps) {
  const role = useShortageStore((s) => s.role)
  const orders = useShortageStore((s) => s.orders)
  const openTaskFlow = useShortageStore((s) => s.openTaskFlow)

  const adviceCount = useMemo(
    () => getTasksForFlowKind(orders, 'procurement_advice').length,
    [orders]
  )
  const salesCount = useMemo(
    () => getTasksForFlowKind(orders, 'sales_method').length,
    [orders]
  )
  const sourceCount = useMemo(
    () => getTasksForFlowKind(orders, 'procurement').length,
    [orders]
  )

  const open = (kind: TaskFlowKind) => () => openTaskFlow(kind)
  const dockClass =
    variant === 'overlay'
      ? 'workbench-role-dock workbench-role-dock--overlay'
      : 'workbench-role-dock'

  const btnClass = (kind: TaskFlowKind) =>
    `btn-primary-sm workbench-role-dock__btn ${
      activeKind === kind ? 'workbench-role-dock__btn--active' : ''
    }`

  if (role === 'ops') {
    return null
  }

  if (role === 'sales') {
    if (variant === 'overlay') return null
    return (
      <div className={dockClass}>
        <span className="workbench-role-dock__label">快速开始：</span>
        <button
          type="button"
          className="btn-primary-sm workbench-role-dock__btn"
          disabled={salesCount === 0}
          onClick={open('sales_method')}
        >
          上传缺货履约方式
          {salesCount > 0 && (
            <span className="workbench-role-dock__badge">{salesCount}</span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={`${dockClass} workbench-role-dock--procurement`}>
      <span className="workbench-role-dock__label">
        {variant === 'overlay' ? '切换任务：' : '快速开始：'}
      </span>
      <button
        type="button"
        className={btnClass('procurement_advice')}
        disabled={adviceCount === 0}
        onClick={open('procurement_advice')}
        aria-current={activeKind === 'procurement_advice' ? 'page' : undefined}
      >
        确认缺货履约建议
        {adviceCount > 0 && <span className="workbench-role-dock__badge">{adviceCount}</span>}
      </button>
      <button
        type="button"
        className={btnClass('procurement')}
        disabled={sourceCount === 0}
        onClick={open('procurement')}
        aria-current={activeKind === 'procurement' ? 'page' : undefined}
      >
        执行缺货寻源
        {sourceCount > 0 && <span className="workbench-role-dock__badge">{sourceCount}</span>}
      </button>
    </div>
  )
}
