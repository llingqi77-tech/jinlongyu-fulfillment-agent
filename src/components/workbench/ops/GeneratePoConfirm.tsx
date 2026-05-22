import { useShortageStore } from '../../../store/shortageStore'
import { SALES_URGENCY_LABEL } from '../../../constants/shortageLabels'

export function GeneratePoConfirm() {
  const poId = useShortageStore((s) => s.generatePoPoId)
  const orders = useShortageStore((s) => s.orders)
  const closeGeneratePo = useShortageStore((s) => s.closeGeneratePo)
  const generatePurchaseOrder = useShortageStore((s) => s.generatePurchaseOrder)

  if (!poId) return null

  const po = orders.find((o) => o.id === poId)
  if (!po) return null

  const readyLines = po.lines.filter((l) => l.status === 'ready_for_po')

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/30 p-4">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-card border border-pale-stone/20 bg-paper-canvas p-5 shadow-md">
        <h3 className="text-base font-semibold text-ink">生成采购订单确认</h3>
        <p className="mt-1 text-xs text-muted">
          {po.id} · {po.customerName}
        </p>
        <table className="mt-4 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th className="py-2">品名</th>
              <th className="py-2">还缺</th>
              <th className="py-2">客户要求</th>
              <th className="py-2">供应商</th>
              <th className="py-2">金额</th>
            </tr>
          </thead>
          <tbody>
            {readyLines.map((line) => (
              <tr key={line.id} className="border-t border-pale-stone/10">
                <td className="py-2">{line.productName}</td>
                <td className="py-2">
                  {line.gap}
                  {line.unit}
                </td>
                <td className="py-2">{SALES_URGENCY_LABEL[line.salesUrgency]}</td>
                <td className="py-2">{line.supplierName}</td>
                <td className="py-2">¥{line.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary-sm" onClick={closeGeneratePo}>
            取消
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() =>
              generatePurchaseOrder(
                po.id,
                readyLines.map((l) => l.id)
              )
            }
          >
            确认生成并写入系统
          </button>
        </div>
      </div>
    </div>
  )
}
