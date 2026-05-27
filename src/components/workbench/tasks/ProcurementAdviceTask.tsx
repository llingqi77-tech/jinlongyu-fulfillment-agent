import { useEffect, useState, type ReactNode } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { generateProcurementAdvice } from '../../../utils/procurementAdviceGenerator'
import { lineNeedsProcurementAdvice } from '../../../utils/fulfillmentMethodRules'
import { daysRemaining } from '../../../utils/shortageAggregations'

const ADVICE_MAX_LEN = 40

function clampAdvice(text: string): string {
  return text.trim().slice(0, ADVICE_MAX_LEN)
}

function Field({
  label,
  children,
  variant = 'default',
}: {
  label: string
  children: ReactNode
  variant?: 'default' | 'remark'
}) {
  return (
    <div
      className={`ops-task-field${variant === 'remark' ? ' ops-task-field--remark' : ''}`}
    >
      <span className="ops-task-field__label">{label}</span>
      <span className="ops-task-field__value">{children}</span>
    </div>
  )
}

export function ProcurementAdviceTask({ lineId }: { lineId: string }) {
  const orders = useShortageStore((s) => s.orders)
  const setOpsAdvice = useShortageStore((s) => s.setOpsAdvice)

  const ctx = orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o }))).find((l) => l.id === lineId)
  const [advice, setAdvice] = useState('')
  const [fromAgent, setFromAgent] = useState(false)
  const savedAdvice = ctx?.opsAdvice?.trim() ?? ''

  useEffect(() => {
    if (!ctx) return
    if (savedAdvice) {
      setAdvice(clampAdvice(savedAdvice))
      setFromAgent(false)
      return
    }
    setAdvice(clampAdvice(generateProcurementAdvice(ctx, ctx.po)))
    setFromAgent(true)
  }, [lineId, savedAdvice, ctx?.id])

  if (!ctx) return null
  if (!lineNeedsProcurementAdvice(ctx)) return null

  const days = daysRemaining(ctx.po.requiredDeliveryDate)
  const estWarehouseDays = days <= 2 ? 2 : 1
  const estLogisticsDays = days <= 2 ? 3 : 2

  const save = () => {
    const trimmed = clampAdvice(advice)
    if (!trimmed) return
    setOpsAdvice(lineId, trimmed)
  }

  return (
    <div className="role-task-panel space-y-5">
      <div className="rounded-lg border border-tech bg-brand-light/40 px-4 py-3 text-body-sm text-ink">
        <p className="font-medium">时效测算（采购确认）</p>
        <p className="mt-2 text-caption text-muted">
          预计到仓 {estWarehouseDays} 天 + 物流 {estLogisticsDays} 天，合计约{' '}
          {estWarehouseDays + estLogisticsDays} 天；客户要求交货 {ctx.po.requiredDeliveryDate}（剩余{' '}
          {days} 天）。
          {estWarehouseDays + estLogisticsDays > days
            ? ' 合计晚于交期，建议销售沟通延期或当期加急。'
            : ' 常规节奏可满足交期。'}
        </p>
      </div>

      <div className="ops-task-panel">
        <div className="ops-task-panel__row ops-task-panel__row--fields">
          <Field label="客户名称">{ctx.po.customerName}</Field>
          <Field label="客户地址">{ctx.po.deliveryAddress}</Field>
          <Field label="产品名称">{ctx.productName}</Field>
          <Field label="缺货数量">
            <span className="font-data font-semibold text-brand">
              {ctx.gap}
              {ctx.unit}
            </span>
          </Field>
          <Field label="规格">{ctx.spec}</Field>
          <Field label="备注" variant="remark">
            {ctx.po.specialNote || '—'}
          </Field>
          <Field label="交货日期">
            <span className="font-data">{ctx.po.requiredDeliveryDate}</span>
          </Field>
        </div>

        <div className="ops-task-panel__row ops-task-panel__row--second">
          <div className="ops-task-field ops-task-field--advice">
            <span className="ops-task-field__label inline-flex items-center gap-2">
              缺货履约建议
              {fromAgent && (
                <span className="rounded-full bg-brand px-2 py-0.5 font-data text-[10px] font-medium text-white">
                  AGENT
                </span>
              )}
            </span>
            <span className="ops-task-field__hint">可修改，确认后流转销售沟通</span>
            <input
              type="text"
              className="input-field ops-task-field__input"
              maxLength={ADVICE_MAX_LEN}
              placeholder="最多40字"
              value={advice}
              onChange={(e) => {
                setAdvice(clampAdvice(e.target.value))
                setFromAgent(false)
              }}
            />
          </div>

          <div className="ops-task-panel__action">
            <button type="button" className="btn-primary" disabled={!advice.trim()} onClick={save}>
              确认并流转销售
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
