import { useEffect, useState } from 'react'
import { OA_APPROVAL_STATUS_LABEL } from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'

export function ProcurementSkuTask({ lineId }: { lineId: string }) {
  const orders = useShortageStore((s) => s.orders)
  const applyCustomSupplier = useShortageStore((s) => s.applyCustomSupplier)
  const submitOaApproval = useShortageStore((s) => s.submitOaApproval)
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
  const supplierReady = showManualEntry
    ? manualFormReady
    : Boolean(ctx.supplierName && ctx.amount > 0)
  const oaStatus = ctx.oaApprovalStatus ?? 'none'

  const pickSupplier = (name: string, amount: number, supplierId: string) => {
    applyCustomSupplier(lineId, name, amount, supplierId)
  }

  return (
    <div className="role-task-panel space-y-5">
      <div className="ops-task-panel">
        <div className="ops-task-panel__row ops-task-panel__row--fields">
          <div className="ops-task-field">
            <span className="ops-task-field__label">客户</span>
            <span className="ops-task-field__value">{ctx.po.customerName}</span>
          </div>
          <div className="ops-task-field">
            <span className="ops-task-field__label">产品</span>
            <span className="ops-task-field__value">
              {ctx.productName} · {ctx.spec}
            </span>
          </div>
          <div className="ops-task-field">
            <span className="ops-task-field__label">缺货</span>
            <span className="ops-task-field__value font-data text-brand">
              {ctx.gap}
              {ctx.unit}
            </span>
          </div>
        </div>
      </div>

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
                    pickSupplier(s.name, Math.round(ctx.gap * ctx.unitPrice * 0.9), s.id)
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
          {manualFormReady && (
            <button
              type="button"
              className="btn-primary-sm mt-3"
              onClick={() => pickSupplier(customName.trim(), Number(customAmount), 'custom')}
            >
              确认选用
            </button>
          )}
        </div>
      )}

      {supplierReady && (
        <div className="procurement-draft-footer">
          {!showManualEntry && (
            <p className="text-caption text-muted">
              已选 {ctx.supplierName} · ¥{ctx.amount.toLocaleString()}
            </p>
          )}

          {oaStatus !== 'none' && (
            <div
              className={`procurement-oa-status procurement-oa-status--${oaStatus}`}
              role="status"
            >
              <span className="procurement-oa-status__label">
                {OA_APPROVAL_STATUS_LABEL[oaStatus]}
              </span>
              {ctx.oaRequestNo ? (
                <span className="procurement-oa-status__no">单号 {ctx.oaRequestNo}</span>
              ) : null}
            </div>
          )}

          {oaStatus === 'none' && (
            <>
              <p className="text-caption text-muted">
                当期到货（加急）须先提交 OA 审批，通过后方可生成采购订单
              </p>
              <button type="button" className="btn-primary" onClick={() => submitOaApproval(lineId)}>
                提交 OA 审批
              </button>
            </>
          )}

          {oaStatus === 'pending' && (
            <p className="text-caption text-muted">
              已推送 OA 系统，审批结果将自动回传至 Agent（演示约 3 秒）
            </p>
          )}

          {oaStatus === 'rejected' && (
            <button type="button" className="btn-primary" onClick={() => submitOaApproval(lineId)}>
              重新提交 OA 审批
            </button>
          )}

          {oaStatus === 'approved' && !ctx.procurementDraftNo && (
            <button type="button" className="btn-primary" onClick={() => generateProcurementDraft(lineId)}>
              生成采购订单
            </button>
          )}

          {ctx.procurementDraftNo && (
            <p className="text-body-sm text-brand-dark">
              采购草稿 {ctx.procurementDraftNo} 已生成，请在弹窗中确认并传入采购系统
            </p>
          )}
        </div>
      )}
    </div>
  )
}
