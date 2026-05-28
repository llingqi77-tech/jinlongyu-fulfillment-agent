import { useMemo } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { getMobileHomeKpis } from '../../../utils/mobileAgentSummary'
import { MobileHomeKpiStrip } from './MobileHomeKpiStrip'

export function MobileDashboardSheet() {
  const open = useShortageStore((s) => s.mobileDashboardOpen)
  const close = useShortageStore((s) => s.closeMobileDashboardSheet)
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)

  const kpisSku = useMemo(() => getMobileHomeKpis(orders, role, 'sku'), [orders, role])

  if (!open) return null

  return (
    <div className="mobile-sheet" role="dialog" aria-modal="true" aria-label="看板数据">
      <button type="button" className="mobile-sheet__backdrop" onClick={close} aria-label="关闭" />
      <div className="mobile-sheet__panel">
        <header className="mobile-sheet__header">
          <h2 className="mobile-sheet__title">看板数据</h2>
          <button type="button" className="mobile-sheet__close" onClick={close} aria-label="关闭">
            ✕
          </button>
        </header>
        <div className="mobile-sheet__body">
          <MobileHomeKpiStrip />
          <dl className="mobile-dashboard-detail">
            <div>
              <dt>缺货 SKU（品维度）</dt>
              <dd>{kpisSku.shortageSkuCount} 个</dd>
            </div>
            <div>
              <dt>缺货总量</dt>
              <dd>{kpisSku.totalGap}（按 PO 行缺口累加）</dd>
            </div>
            <div>
              <dt>待你处理（品）</dt>
              <dd>{kpisSku.pendingTaskCount} 个</dd>
            </div>
            <div>
              <dt>今日已履约（品）</dt>
              <dd>{kpisSku.fulfilledCount} 个</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
