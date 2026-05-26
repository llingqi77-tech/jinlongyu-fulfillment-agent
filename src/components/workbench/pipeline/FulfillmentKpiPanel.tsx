import { useShortageStore } from '../../../store/shortageStore'
import { getFulfillmentKpis } from '../../../utils/shortageAggregations'
import { ProgressBar } from '../shared/ProgressBar'

export function FulfillmentKpiPanel() {
  const orders = useShortageStore((s) => s.orders)
  const kpis = getFulfillmentKpis(orders)
  const pct =
    kpis.expectedQty > 0 ? Math.min(100, Math.round((kpis.actualQty / kpis.expectedQty) * 100)) : 0

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="kpi-card">
        <p className="kpi-card__label">预计履约数量</p>
        <p className="kpi-card__value">
          {kpis.expectedQty.toLocaleString()}
          <span className="ml-1 text-sm font-sans font-normal text-muted">件</span>
        </p>
        <p className="kpi-card__hint">形成销售出库单 / 采购确认后累计</p>
      </div>
      <div className="kpi-card">
        <p className="kpi-card__label">实际履约数量</p>
        <p className="kpi-card__value kpi-card__value--accent">
          {kpis.actualQty.toLocaleString()}
          <span className="ml-1 text-sm font-sans font-normal text-muted">件</span>
        </p>
        <p className="kpi-card__hint">客户签收后实时更新</p>
      </div>
      <div className="kpi-card">
        <p className="kpi-card__label">签收进度</p>
        <p className="kpi-card__value text-lg">
          {kpis.signedSkuCount}/{kpis.totalSkuCount} SKU
        </p>
        <ProgressBar value={pct} className="mt-3" />
        <p className="kpi-card__hint">{pct}% · 还缺总量 {kpis.totalGap}</p>
      </div>
    </section>
  )
}
