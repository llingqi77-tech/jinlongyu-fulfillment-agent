import { useEffect, useState, type ReactNode } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { generateOpsAdvice } from '../../../utils/opsAdviceGenerator'

const ADVICE_MAX_LEN = 20

function clampAdvice(text: string): string {
  return text.trim().slice(0, ADVICE_MAX_LEN)
}

function OpsField({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`ops-task-field ${className}`.trim()}>
      <span className="ops-task-field__label">{label}</span>
      <span className="ops-task-field__value">{children}</span>
    </div>
  )
}

export function OpsFulfillmentTask({ lineId }: { lineId: string }) {
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
    setAdvice(clampAdvice(generateOpsAdvice(ctx, ctx.po)))
    setFromAgent(true)
  }, [lineId, savedAdvice, ctx?.id])

  if (!ctx) return null

  const save = () => {
    const trimmed = clampAdvice(advice)
    if (!trimmed) return
    setOpsAdvice(lineId, trimmed)
  }

  return (
    <div className="ops-task-panel">
      <div className="ops-task-panel__row ops-task-panel__row--fields">
        <OpsField label="客户名称">{ctx.po.customerName}</OpsField>
        <OpsField label="客户地址">{ctx.po.deliveryAddress}</OpsField>
        <OpsField label="产品名称">{ctx.productName}</OpsField>
        <OpsField label="缺货数量">
          <span className="font-mono font-semibold text-brand">
            {ctx.gap}
            {ctx.unit}
          </span>
        </OpsField>
        <OpsField label="规格">{ctx.spec}</OpsField>
        <OpsField label="备注" className="ops-task-field--remark">
          {ctx.po.specialNote || '—'}
        </OpsField>
        <OpsField label="交货日期">
          <span className="font-mono">{ctx.po.requiredDeliveryDate}</span>
        </OpsField>
      </div>

      <div className="ops-task-panel__row ops-task-panel__row--second">
        <div className="ops-task-field ops-task-field--advice">
          <span className="ops-task-field__label inline-flex items-center gap-2">
            缺货履约建议
            {fromAgent && (
              <span className="rounded-full bg-brand px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                AGENT
              </span>
            )}
          </span>
          <span className="ops-task-field__hint">可修改</span>
          <input
            type="text"
            className="input-field ops-task-field__input"
            maxLength={ADVICE_MAX_LEN}
            placeholder="最多20字"
            value={advice}
            onChange={(e) => {
              setAdvice(clampAdvice(e.target.value))
              setFromAgent(false)
            }}
          />
        </div>

        <div className="ops-task-panel__action">
          <button type="button" className="btn-primary" disabled={!advice.trim()} onClick={save}>
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
