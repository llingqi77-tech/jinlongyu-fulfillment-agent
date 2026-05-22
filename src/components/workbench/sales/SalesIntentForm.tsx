import { useEffect, useState } from 'react'
import type { SalesUrgency } from '../../../types/shortage'
import { useShortageStore } from '../../../store/shortageStore'

export function SalesIntentForm({
  lineId,
  poId,
  onSaved,
}: {
  lineId?: string
  poId?: string
  onSaved?: () => void
}) {
  const orders = useShortageStore((s) => s.orders)
  const setSalesIntent = useShortageStore((s) => s.setSalesIntent)
  const setSalesIntentForPo = useShortageStore((s) => s.setSalesIntentForPo)

  const line = lineId
    ? orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o }))).find((x) => x.id === lineId)
    : undefined
  const po = poId ? orders.find((o) => o.id === poId) : line?.po

  const [urgency, setUrgency] = useState<SalesUrgency>('must_on_time')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (line) {
      setUrgency(line.salesUrgency === 'pending' ? 'must_on_time' : line.salesUrgency)
      setNote(line.salesNote)
    }
  }, [line?.id, line?.salesUrgency, line?.salesNote])

  if (!po && !line) return null

  const save = () => {
    if (lineId) {
      setSalesIntent(lineId, urgency, note)
    } else if (poId) {
      setSalesIntentForPo(poId, urgency, note)
    }
    onSaved?.()
  }

  return (
    <div className="rounded-card border border-pale-stone/15 bg-atmosphere-wash/30 p-4">
      <h3 className="text-sm font-semibold text-ink">
        {line ? `登记 · ${line.productName}` : '登记客户沟通结论'}
      </h3>
      <p className="mt-1 text-xs text-muted">
        出货单要求送达：{po?.requiredDeliveryDate}
        {line && (
          <span className="ml-2">
            还缺 {line.gap}
            {line.unit}
          </span>
        )}
      </p>
      <div className="mt-3 flex flex-col gap-2 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`urgency-${lineId ?? poId}`}
            checked={urgency === 'must_on_time'}
            onChange={() => setUrgency('must_on_time')}
          />
          必须当期到货（按出货单日期送达）
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`urgency-${lineId ?? poId}`}
            checked={urgency === 'normal'}
            onChange={() => setUrgency('normal')}
          />
          不急，可走正常补货流程
        </label>
      </div>
      <textarea
        className="mt-3 w-full rounded-lg border border-pale-stone/30 bg-paper-canvas px-3 py-2 text-xs"
        rows={2}
        placeholder="沟通备注（可按品填写不同说明）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button type="button" className="btn-primary mt-3 text-xs" onClick={save}>
        {lineId ? '保存本品结论' : '保存至本单所有缺货行'}
      </button>
    </div>
  )
}
