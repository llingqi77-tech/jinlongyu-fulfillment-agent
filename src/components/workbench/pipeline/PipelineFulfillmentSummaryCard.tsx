import { useShortageStore } from '../../../store/shortageStore'
import { FULFILLMENT_DONE_METHOD_CHART_COLOR } from '../../../constants/shortageLabels'
import { getFulfillmentDoneSummary } from '../../../utils/shortageAggregations'
import type { FulfillmentMethod } from '../../../types/shortage'

function chartColor(method: FulfillmentMethod): string {
  if (method in FULFILLMENT_DONE_METHOD_CHART_COLOR) {
    return FULFILLMENT_DONE_METHOD_CHART_COLOR[
      method as keyof typeof FULFILLMENT_DONE_METHOD_CHART_COLOR
    ]
  }
  return '#94a3b8'
}

export function PipelineFulfillmentSummaryCard() {
  const orders = useShortageStore((s) => s.orders)
  const s = getFulfillmentDoneSummary(orders)

  return (
    <div className="pipeline-summary-card pipeline-summary-card--fashion">
      <div className="summary-card__head">
        <h4 className="summary-card__title">履约任务完成</h4>
        <span className="summary-card__tag">本周</span>
      </div>

      <div className="summary-card__heroes summary-card__heroes--triple">
        <div className="summary-hero summary-hero--sm summary-hero--accent">
          <span className="summary-hero__value">{s.hotelCount}</span>
          <span className="summary-hero__label">酒店</span>
        </div>
        <div className="summary-hero summary-hero--sm">
          <span className="summary-hero__value">{s.orderCount}</span>
          <span className="summary-hero__label">订单</span>
        </div>
        <div className="summary-hero summary-hero--sm">
          <span className="summary-hero__value">{s.completedLineCount}</span>
          <span className="summary-hero__label">品项</span>
        </div>
      </div>

      {s.completedLineCount > 0 ? (
        <div className="summary-mix-chart">
          <p className="summary-card__insight-title">履约方式分布</p>
          <div className="summary-mix-chart__bar">
            {s.methodMix
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.method}
                  className="summary-mix-chart__segment"
                  data-method={item.method}
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: chartColor(item.method),
                  }}
                  title={`${item.label} ${item.percent}%`}
                />
              ))}
          </div>
          <ul className="summary-mix-chart__legend">
            {s.methodMix.map((item) => (
              <li key={item.method}>
                <span
                  className="summary-mix-chart__dot"
                  style={{ backgroundColor: chartColor(item.method) }}
                />
                <span className="summary-mix-chart__name">{item.label}</span>
                <span className="summary-mix-chart__val">
                  {item.count} · {item.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="summary-card__empty">本周暂无已完成履约</p>
      )}
    </div>
  )
}
