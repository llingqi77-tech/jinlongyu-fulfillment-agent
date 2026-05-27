import { useEffect, useState } from 'react'
import type { FulfillmentMethod } from '../../../types/shortage'
import {
  FULFILLMENT_METHOD_LABEL,
  SALES_SELECTABLE_METHODS,
} from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import { showsProcurementAdvice } from '../../../utils/fulfillmentMethodRules'

const BACKEND_DRIVEN_METHODS: FulfillmentMethod[] = ['direct_ship', 'normal_replenishment']

function defaultSalesMethod(current: FulfillmentMethod | undefined): FulfillmentMethod {
  if (!current || current === 'pending' || BACKEND_DRIVEN_METHODS.includes(current)) {
    return SALES_SELECTABLE_METHODS[0]
  }
  return current
}

export function SalesFulfillmentForm({ lineId }: { lineId: string }) {
  const orders = useShortageStore((s) => s.orders)
  const setFulfillmentMethod = useShortageStore((s) => s.setFulfillmentMethod)

  const ctx = orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o }))).find((l) => l.id === lineId)
  const [method, setMethod] = useState<FulfillmentMethod>(() =>
    defaultSalesMethod(ctx?.fulfillmentMethod)
  )
  const [note, setNote] = useState(ctx?.salesNote ?? '')

  useEffect(() => {
    setMethod(defaultSalesMethod(ctx?.fulfillmentMethod))
    setNote(ctx?.salesNote ?? '')
  }, [lineId, ctx?.fulfillmentMethod, ctx?.salesNote])

  if (!ctx) return null

  const confirmLabel =
    method === 'must_on_time' ? '确认并流转采购' : '确认并生成出库单'

  return (
    <div className="role-task-panel space-y-5">
      {showsProcurementAdvice(ctx.fulfillmentMethod) && ctx.opsAdvice.trim() && (
        <div className="agent-advice-panel rounded-lg px-4 py-3">
          <p className="text-caption font-medium text-muted">采购缺货履约建议</p>
          <p className="mt-2 text-body-sm text-ink">{ctx.opsAdvice}</p>
        </div>
      )}

      <div>
        <p className="text-body-sm font-medium text-ink">与客户沟通后选择履约方式</p>
        <p className="mt-1 text-caption text-muted">
          仅可选延期或当期到货；选延期将直接生成出库单并走物流，选当期到货将流转采购寻源。
        </p>
        <div className="mt-3 flex flex-col gap-2 text-body-sm">
          {SALES_SELECTABLE_METHODS.map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                method === m
                  ? 'border-brand bg-brand-light shadow-subtle'
                  : 'border-tech bg-white hover:border-brand/30'
              }`}
            >
              <input
                type="radio"
                name={`method-${lineId}`}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="accent-brand"
              />
              {FULFILLMENT_METHOD_LABEL[m]}
            </label>
          ))}
        </div>
      </div>

      <textarea
        className="input-field w-full"
        rows={2}
        placeholder="沟通备注（可选）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="role-task-panel__footer">
        <button type="button" className="btn-primary" onClick={() => setFulfillmentMethod(lineId, method, note)}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
