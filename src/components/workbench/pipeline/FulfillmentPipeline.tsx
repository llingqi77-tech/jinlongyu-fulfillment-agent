import { useEffect, useState } from 'react'
import type { WorkbenchRole } from '../../../types/shortage'
import { useShortageStore } from '../../../store/shortageStore'
import { getPipelineChevronStages } from '../../../utils/shortageAggregations'
import { PipelineColumnTaskPanel } from './PipelineColumnTaskPanel'
import { GeneratePoConfirm } from '../ops/GeneratePoConfirm'

const TASK_PAGE_ID = 'pipeline-task-page'

const ROLE_TASK_PAGE_TITLE: Record<WorkbenchRole, string> = {
  ops: '运营任务执行',
  sales: '销售任务执行',
  procurement: '采购任务执行',
}

export function FulfillmentPipeline() {
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
  const stages = getPipelineChevronStages(orders)
  const [taskViewRole, setTaskViewRole] = useState<WorkbenchRole | null>(null)

  useEffect(() => {
    setTaskViewRole(null)
  }, [role])

  const roleStage = stages.find((s) => s.actionRole === role)
  const activeStage = stages.find((s) => s.actionRole === taskViewRole)

  const openTaskPage = (targetRole: WorkbenchRole) => {
    setTaskViewRole(targetRole)
    requestAnimationFrame(() => {
      document.getElementById(TASK_PAGE_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <section className="workbench-section workbench-section--pipeline">
      <div className="workbench-section__header">
        <h2 className="workbench-section__title">履约进度</h2>
      </div>

      <div className="pipeline-columns">
        {stages.map((stage) => {
          const isRoleColumn = role === stage.actionRole
          const isTaskOpen = taskViewRole === stage.actionRole

          return (
            <article
              key={stage.key}
              className={`pipeline-column ${isRoleColumn ? 'pipeline-column--active' : ''} ${
                isTaskOpen ? 'pipeline-column--task-open' : ''
              }`}
            >
              <header className="pipeline-column__header">
                <h3 className="pipeline-column__title">{stage.title}</h3>
                <div className="pipeline-column__progress">
                  <div
                    className="pipeline-column__progress-track"
                    role="progressbar"
                    aria-valuenow={stage.progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`已完成 ${stage.progressDone} / ${stage.progressTotal}`}
                  >
                    <div
                      className="pipeline-column__progress-done"
                      style={{ width: `${stage.progressPercent}%` }}
                    />
                    <div
                      className="pipeline-column__progress-pending"
                      style={{ width: `${100 - stage.progressPercent}%` }}
                    />
                  </div>
                  <p className="pipeline-column__progress-text">
                    <span className="pipeline-column__progress-text--done">
                      已完成 {stage.progressDone}
                    </span>
                    <span className="pipeline-column__progress-text--sep">/</span>
                    <span className="pipeline-column__progress-text--total">
                      {stage.progressTotal}
                    </span>
                  </p>
                </div>
              </header>

              <div className="pipeline-column__body">
                <div className="pipeline-column__metric">
                  <span className="pipeline-column__num pipeline-column__num--accent">
                    {stage.row1Value}
                  </span>
                  <span className="pipeline-column__label">{stage.row1Label}</span>
                </div>
                <div className="pipeline-column__metric">
                  <span className="pipeline-column__num">{stage.row2Value}</span>
                  <span className="pipeline-column__label">{stage.row2Label}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {roleStage?.actionRole && !taskViewRole && (
        <div className="pipeline-columns-action">
          <button
            type="button"
            className="btn-primary pipeline-columns-action__btn"
            onClick={() => openTaskPage(role)}
          >
            进入任务执行
          </button>
        </div>
      )}

      {taskViewRole && (
        <div id={TASK_PAGE_ID} className="pipeline-task-page">
          <header className="pipeline-task-page__header">
            <div className="pipeline-task-page__header-main">
              <h3 className="pipeline-task-page__title">{ROLE_TASK_PAGE_TITLE[taskViewRole]}</h3>
              {activeStage && (
                <p className="pipeline-task-page__subtitle">
                  {activeStage.taskPageTitle ?? activeStage.title}
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn-ghost pipeline-task-page__back"
              onClick={() => setTaskViewRole(null)}
            >
              收起任务面板
            </button>
          </header>
          <div className="pipeline-task-page__body">
            <PipelineColumnTaskPanel role={taskViewRole} />
          </div>
        </div>
      )}

      <GeneratePoConfirm />
    </section>
  )
}
