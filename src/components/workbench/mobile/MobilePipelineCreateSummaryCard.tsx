import { useShortageStore } from '../../../store/shortageStore'
import { getOpsCreateSummary } from '../../../utils/shortageAggregations'

/** 手机端专用：解析率与 chips 同一行 */
export function MobilePipelineCreateSummaryCard() {
  const orders = useShortageStore((s) => s.orders)
  const s = getOpsCreateSummary(orders)
  const parsePct = s.poSynced > 0 ? Math.round((s.poParsed / s.poSynced) * 100) : 0

  return (
    <div className="pipeline-summary-card pipeline-summary-card--fashion mobile-summary-card--create">
      <div className="summary-card__head">
        <h4 className="summary-card__title">履约任务创建</h4>
        <span className="summary-card__tag">今日交货</span>
      </div>

      <div className="summary-card__heroes">
        <div className="summary-hero">
          <span className="summary-hero__value">{s.poSynced}</span>
          <span className="summary-hero__label">已同步 PO 单</span>
        </div>
        <div className="summary-hero summary-hero--accent">
          <span className="summary-hero__value-wrap">
            <span className="summary-hero__value">{s.totalGapQty}</span>
            <span className="summary-hero__unit">件</span>
          </span>
          <span className="summary-hero__label">缺货总量</span>
        </div>
      </div>

      <div className="mobile-summary-insight-row">
        <div className="summary-card__insight mobile-summary-insight">
          <div className="mobile-summary-insight__main">
            <div
              className="summary-ring"
              style={{ '--ring-pct': `${parsePct}%` } as React.CSSProperties}
              aria-hidden
            >
              <span className="summary-ring__inner">{parsePct}%</span>
            </div>
            <div className="summary-card__insight-text">
              <p className="summary-card__insight-title">缺货 PO 解析率</p>
              <p className="summary-card__insight-sub">
                已解析 <strong>{s.poParsed}</strong> / {s.poSynced} 单
              </p>
            </div>
          </div>
          <p className="mobile-summary-stats">
            <strong>{s.skuCount}</strong> 品项 · <strong>{s.hotelCount}</strong> 酒店 ·{' '}
            <strong>{s.shortageLineCount}</strong> 行
          </p>
        </div>
      </div>
    </div>
  )
}
