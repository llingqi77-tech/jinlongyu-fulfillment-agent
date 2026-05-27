import { SALES_OUTBOUND_LABEL } from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import { needsLogistics } from '../../../utils/shortageAggregations'

export function LogisticsSignoffPanel({ lineId }: { lineId: string }) {
  const orders = useShortageStore((s) => s.orders)
  const applySignoff = useShortageStore((s) => s.applySignoff)

  const ctx = orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o }))).find((l) => l.id === lineId)
  if (!ctx || !needsLogistics(ctx)) return null

  return (
    <div className="rounded-xl border border-tech bg-cloud-canvas/50 px-4 py-3 text-body-sm">
      <p className="font-medium text-ink">物流执行 · 客户签收</p>
      {ctx.salesOutboundType && (
        <p className="mt-1 font-data text-caption text-muted">
          {SALES_OUTBOUND_LABEL[ctx.salesOutboundType]} {ctx.salesOutboundNo}
        </p>
      )}
      <p className="mt-2 font-data text-caption text-ink">
        预计 {ctx.expectedFulfillQty}
        {ctx.unit} · 实际 {ctx.actualFulfillQty}
        {ctx.unit}
        {ctx.signoffStatus === 'signed' && (
          <span className="ml-2 font-sans text-fire-orange">已签收</span>
        )}
      </p>
      {ctx.signoffStatus !== 'signed' && (
        <button type="button" className="btn-secondary-sm mt-3" onClick={() => applySignoff(lineId)}>
          模拟客户签收
        </button>
      )}
    </div>
  )
}
