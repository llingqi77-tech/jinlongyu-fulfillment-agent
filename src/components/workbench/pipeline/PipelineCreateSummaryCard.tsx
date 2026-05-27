import { useShortageStore } from '../../../store/shortageStore'
import { getOpsCreateSummary } from '../../../utils/shortageAggregations'

export function PipelineCreateSummaryCard() {
  const orders = useShortageStore((s) => s.orders)
  const s = getOpsCreateSummary(orders)
  const parsePct = s.poSynced > 0 ? Math.round((s.poParsed / s.poSynced) * 100) : 0

  return (
    <div className="pipeline-summary-card pipeline-summary-card--fashion">
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

      <div className="summary-card__insight">
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

      <div className="summary-card__chips">
        <span className="summary-chip">
          <em>{s.skuCount}</em> 缺货品项
        </span>
        <span className="summary-chip">
          <em>{s.hotelCount}</em> 酒店
        </span>
        <span className="summary-chip">
          <em>{s.shortageLineCount}</em> 缺货行
        </span>
      </div>
    </div>
  )
}
