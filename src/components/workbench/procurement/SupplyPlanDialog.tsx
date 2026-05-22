import { useMemo, useState } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { getShortageLines } from '../../../utils/shortageAggregations'
import type { SupplyPlanInput } from '../../../types/shortage'

export function SupplyPlanDialog() {
  const dialog = useShortageStore((s) => s.supplyDialog)
  const orders = useShortageStore((s) => s.orders)
  const closeSupplyDialog = useShortageStore((s) => s.closeSupplyDialog)
  const applySupplyPlan = useShortageStore((s) => s.applySupplyPlan)

  const [supplierName, setSupplierName] = useState('益海嘉里华北供应链')
  const [amountInput, setAmountInput] = useState('5000')

  const parsedAmount = amountInput === '' ? NaN : Number(amountInput)
  const amountValid = amountInput !== '' && !Number.isNaN(parsedAmount) && parsedAmount > 0

  const hint = useMemo(() => {
    if (!dialog?.lineId) return null
    const line = getShortageLines(orders).find((l) => l.id === dialog.lineId)
    if (!line) return null
    return {
      hotel: line.po.customerName,
      product: line.productName,
      gap: line.gap,
      unit: line.unit,
    }
  }, [dialog, orders])

  if (!dialog) return null

  const submit = () => {
    if (!supplierName.trim() || !amountValid) return
    const input: SupplyPlanInput = { supplierName: supplierName.trim(), amount: parsedAmount }
    applySupplyPlan(input, { lineIds: [dialog.lineId] })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/30 p-4">
      <div className="w-full max-w-md rounded-card border border-pale-stone/20 bg-paper-canvas p-5 shadow-md">
        <h3 className="text-base font-semibold text-ink">录入方案</h3>
        {hint && (
          <div className="mt-3 rounded-lg bg-atmosphere-wash/50 px-3 py-2 text-xs text-ink">
            <p>
              {hint.hotel} · {hint.product}
            </p>
            <p className="mt-1 text-muted">
              还缺 {hint.gap}
              {hint.unit}
            </p>
          </div>
        )}
        <div className="mt-4 space-y-3 text-xs">
          <label className="block">
            <span className="text-muted">供应商</span>
            <input
              className="mt-1 w-full rounded-lg border border-pale-stone/30 px-3 py-2"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-muted">采购金额</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="请输入金额"
              className="mt-1 w-full rounded-lg border border-pale-stone/30 px-3 py-2"
              value={amountInput}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^\d+$/.test(v)) setAmountInput(v)
              }}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary-sm" onClick={closeSupplyDialog}>
            取消
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={submit}
            disabled={!supplierName.trim() || !amountValid}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
