import { useShortageStore } from '../../../store/shortageStore'
import { getPipelineChevronStages } from '../../../utils/shortageAggregations'
import { MobilePipelineCreateSummaryCard } from './MobilePipelineCreateSummaryCard'
import { MobilePipelineFulfillmentSummaryCard } from './MobilePipelineFulfillmentSummaryCard'


export function MobileFulfillmentDashboard() {
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
  const stages = getPipelineChevronStages(orders)

  return (
    <div className="mobile-dashboard-scroll">
      <h2 className="mobile-section-title">履约进度总览</h2>

      <div className="mobile-pipeline-list" role="list">
        {stages.map((stage, index) => {
          const isActive = role === stage.actionRole
          return (
            <article
              key={stage.key}
              className={`mobile-pipeline-step ${isActive ? 'mobile-pipeline-step--active' : ''}`}
              role="listitem"
              aria-label={`第${index + 1}步 ${stage.title}`}
            >
              <span className="mobile-pipeline-step__badge" aria-hidden>
                {index + 1}
              </span>
              <div className="mobile-pipeline-step__body">
                <div className="mobile-pipeline-step__top">
                  <h3 className="mobile-pipeline-step__title">{stage.title}</h3>
                  <span className="mobile-pipeline-step__ratio">
                    {stage.progressDone}/{stage.progressTotal}
                  </span>
                </div>
                <div
                  className="mobile-pipeline-step__track"
                  role="progressbar"
                  aria-valuenow={stage.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="mobile-pipeline-step__track-done"
                    style={{ width: `${stage.progressPercent}%` }}
                  />
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="mobile-summary-stack">
        <div className="mobile-summary-card mobile-summary-card--compact">
          <MobilePipelineCreateSummaryCard />
        </div>
        <div className="mobile-summary-card mobile-summary-card--compact">
          <MobilePipelineFulfillmentSummaryCard />
        </div>
      </div>
    </div>
  )
}
