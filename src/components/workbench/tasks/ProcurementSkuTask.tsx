import { useEffect, useState } from 'react'
import { useShortageStore } from '../../../store/shortageStore'

export function ProcurementSkuTask({ lineId }: { lineId: string }) {
  const orders = useShortageStore((s) => s.orders)
  const applyCustomSupplier = useShortageStore((s) => s.applyCustomSupplier)
  const generateProcurementDraft = useShortageStore((s) => s.generateProcurementDraft)

  const ctx = orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o }))).find((l) => l.id === lineId)
  const [customName, setCustomName] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)

  useEffect(() => {
    setShowManualEntry(false)
    setCustomName('')
    setCustomAmount('')
  }, [lineId])

  if (!ctx) return null

  const manualFormReady = Boolean(customName.trim() && customAmount)
  const showDraftFooter = showManualEntry
    ? manualFormReady
    : Boolean(ctx.supplierName && ctx.amount > 0)

  const generateDraft = () => {
    if (showManualEntry) {
      if (!manualFormReady) return
      applyCustomSupplier(lineId, customName.trim(), Number(customAmount))
    } else if (!ctx.supplierName || ctx.amount <= 0) {
      return
    }
    generateProcurementDraft(lineId)
  }

  return (
    <div className="role-task-panel space-y-5">
      {!showManualEntry ? (
        <div className="procurement-suppliers">
          <div className="procurement-suppliers__header">
            <p className="text-body-sm font-medium text-ink">系统推荐供应商（Top 3）</p>
            <button
              type="button"
              className="btn-primary-sm shrink-0"
              onClick={() => setShowManualEntry(true)}
            >
              都没库存，去手动录入
            </button>
          </div>
          <div className="procurement-suppliers__row">
            {ctx.recommendedSuppliers.map((s) => (
              <div
                key={s.id}
                className={`procurement-supplier-card text-body-sm shadow-card transition-all ${
                  ctx.selectedSupplierId === s.id ? 'procurement-supplier-card--selected' : ''
                }`}
              >
                <div className="procurement-supplier-card__info">
                  <span className="font-medium text-ink">{s.name}</span>
                </div>
                <button
                  type="button"
                  className={`btn-secondary-sm w-full ${
                    ctx.selectedSupplierId === s.id ? 'procurement-supplier-card__pick--active' : ''
                  }`}
                  onClick={() =>
                    applyCustomSupplier(
                      lineId,
                      s.name,
                      Math.round(ctx.gap * ctx.unitPrice * 0.9),
                      s.id
                    )
                  }
                >
                  选用
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="procurement-manual rounded-xl border border-tech bg-white p-4 text-body-sm">
          <div className="procurement-manual__header">
            <p className="font-medium text-ink">手动录入供应商</p>
            <button
              type="button"
              className="btn-secondary-sm shrink-0"
              onClick={() => setShowManualEntry(false)}
            >
              返回系统推荐
            </button>
          </div>
          <input
            className="input-field mt-3 w-full"
            placeholder="供应商名称"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <input
            className="input-field mt-2 w-full"
            placeholder="采购金额"
            value={customAmount}
            onChange={(e) => {
              const v = e.target.value
              if (v === '' || /^\d+$/.test(v)) setCustomAmount(v)
            }}
          />
        </div>
      )}

      {showDraftFooter && (
        <div className="procurement-draft-footer">
          {!showManualEntry && (
            <p className="text-caption text-muted">
              已选 {ctx.supplierName} · ¥{ctx.amount.toLocaleString()}
            </p>
          )}
          <button type="button" className="btn-primary" onClick={generateDraft}>
            生成采购订单
          </button>
        </div>
      )}
    </div>
  )
}
