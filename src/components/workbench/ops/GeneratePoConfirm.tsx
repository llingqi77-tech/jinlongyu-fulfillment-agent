import { useShortageStore } from '../../../store/shortageStore'
import { FULFILLMENT_METHOD_LABEL } from '../../../constants/shortageLabels'

export function GeneratePoConfirm() {
  const lineId = useShortageStore((s) => s.generatePoLineId)
  const orders = useShortageStore((s) => s.orders)
  const closeGeneratePo = useShortageStore((s) => s.closeGeneratePo)
  const confirmProcurementToErp = useShortageStore((s) => s.confirmProcurementToErp)

  if (!lineId) return null

  const ctx = orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o }))).find((l) => l.id === lineId)
  if (!ctx) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-tech bg-white p-6 shadow-elevated">
        <h3 className="text-heading-sm font-medium tracking-tight text-ink">确认采购订单</h3>
        <p className="mt-1 font-mono text-caption text-muted">草稿 {ctx.procurementDraftNo}</p>
        <dl className="mt-6 space-y-3 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">品名</dt>
            <dd className="text-ink">{ctx.productName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">酒店</dt>
            <dd className="text-ink">{ctx.po.customerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">履约方式</dt>
            <dd className="text-ink">{FULFILLMENT_METHOD_LABEL[ctx.fulfillmentMethod]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">供应商</dt>
            <dd className="text-ink">{ctx.supplierName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">金额</dt>
            <dd className="font-mono font-semibold text-fire-orange">¥{ctx.amount.toLocaleString()}</dd>
          </div>
        </dl>
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className="btn-secondary-sm" onClick={closeGeneratePo}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={() => confirmProcurementToErp(lineId)}>
            一键确认并传入采购系统
          </button>
        </div>
      </div>
    </div>
  )
}
