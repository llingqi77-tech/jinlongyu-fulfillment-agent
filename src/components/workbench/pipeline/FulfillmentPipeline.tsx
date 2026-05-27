import { useShortageStore } from '../../../store/shortageStore'
import { getPipelineChevronStages } from '../../../utils/shortageAggregations'
import { PipelineCreateSummaryCard } from './PipelineCreateSummaryCard'
import { PipelineFulfillmentSummaryCard } from './PipelineFulfillmentSummaryCard'

export function FulfillmentPipeline() {
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
  const stages = getPipelineChevronStages(orders)

  return (
    <section className="workbench-section workbench-section--pipeline workbench-section--compact">
      <div className="workbench-section__header">
        <h2 className="workbench-section__title">履约进度总览</h2>
      </div>

      <div className="pipeline-dashboard">
        <div className="pipeline-columns">
          {stages.map((stage) => {
            const isRoleColumn = role === stage.actionRole

            return (
              <article
                key={stage.key}
                className={`pipeline-column ${
                  isRoleColumn ? 'pipeline-column--active' : ''
                }`}
                aria-label={stage.title}
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

        <div className="pipeline-dashboard__summary-row">
          <PipelineCreateSummaryCard />
          <PipelineFulfillmentSummaryCard />
        </div>

      </div>
    </section>
  )
}
