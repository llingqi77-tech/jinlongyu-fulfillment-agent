import { useShortageStore } from '../../../store/shortageStore'
import { FULFILLMENT_DONE_METHOD_CHART_COLOR } from '../../../constants/shortageLabels'
import {
  formatSkuMixCount,
  getFulfillmentDoneSummary,
} from '../../../utils/shortageAggregations'
import type { FulfillmentMethod } from '../../../types/shortage'

function chartColor(method: FulfillmentMethod): string {
  if (method in FULFILLMENT_DONE_METHOD_CHART_COLOR) {
    return FULFILLMENT_DONE_METHOD_CHART_COLOR[
      method as keyof typeof FULFILLMENT_DONE_METHOD_CHART_COLOR
    ]
  }
  return '#94a3b8'
}

/** 手机端精简：指标一行 + 色条 */
export function MobilePipelineFulfillmentSummaryCard() {
  const orders = useShortageStore((s) => s.orders)
  const s = getFulfillmentDoneSummary(orders)

  return (
    <div className="pipeline-summary-card pipeline-summary-card--fashion mobile-summary-card--done">
      <div className="summary-card__head">
        <h4 className="summary-card__title">履约任务完成</h4>
        <span className="summary-card__tag">本周</span>
      </div>

      <div className="mobile-summary-metrics">
        <span>
          <em>{s.hotelCount}</em> 酒店
        </span>
        <span>
          <em>{s.orderCount}</em> 订单
        </span>
        <span>
          <em>{s.completedLineCount}</em> 品项
        </span>
      </div>

      {s.completedLineCount > 0 ? (
        <div className="summary-mix-chart mobile-summary-mix-chart--compact">
          <p className="summary-card__insight-title mobile-summary-mix-chart__title">
            履约方式分布
          </p>
          <div className="summary-mix-chart__bar">
            {s.methodMix
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.method}
                  className="summary-mix-chart__segment"
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: chartColor(item.method),
                  }}
                  title={`${item.label} ${formatSkuMixCount(item.count)} ${item.percent}%`}
                />
              ))}
          </div>
          <ul className="summary-mix-chart__legend mobile-summary-mix-chart__legend">
            {s.methodMix.map((item) => (
              <li key={item.method}>
                <span
                  className="summary-mix-chart__dot"
                  style={{ backgroundColor: chartColor(item.method) }}
                />
                <span className="summary-mix-chart__name">{item.label}</span>
                <span className="summary-mix-chart__val">
                  {formatSkuMixCount(item.count)} · {item.percent}%
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
