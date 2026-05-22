import type { ProcurementMode, SalesUrgency, ShortageLineStatus, ShortagePOLine } from '../../../types/shortage'
import {
  getSalesCommunicationLabel,
  LINE_STATUS_LABEL,
  PROCUREMENT_LINE_STATUS_LABEL,
  PROCUREMENT_MODE_LABEL,
  SALES_URGENCY_LABEL,
} from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import { getProcurementDisplayStatus } from '../../../utils/shortageAggregations'

export function LineStatusBadge({ status }: { status: ShortageLineStatus }) {
  const colors: Record<ShortageLineStatus, string> = {
    new: 'bg-segment-track text-muted',
    await_sales: 'bg-atmosphere-wash text-ink',
    await_procurement: 'bg-atmosphere-wash text-ink',
    ready_for_po: 'bg-off-black text-paper-canvas',
    completed: 'bg-pale-stone/20 text-pale-stone',
    cancelled: 'bg-segment-track text-muted',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[status]}`}>
      {LINE_STATUS_LABEL[status]}
    </span>
  )
}

/** 销售缺货沟通总览：登记前待确认，登记后已完成 */
export function SalesCommunicationBadge({ urgency }: { urgency: SalesUrgency }) {
  const label = getSalesCommunicationLabel(urgency)
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
        label === '待确认' ? 'bg-atmosphere-wash text-muted' : 'bg-pale-stone/30 text-muted'
      }`}
    >
      {label}
    </span>
  )
}

export function SalesUrgencyBadge({ urgency }: { urgency: SalesUrgency }) {
  const role = useShortageStore((s) => s.role)
  const urgent = urgency === 'must_on_time'
  const label =
    urgency === 'pending' && role === 'sales' ? '待确认' : SALES_URGENCY_LABEL[urgency]
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
        urgent ? 'bg-off-black text-paper-canvas' : urgency === 'normal' ? 'bg-segment-track text-ink' : 'bg-atmosphere-wash text-muted'
      }`}
    >
      {label}
    </span>
  )
}

export function ProcurementLineStatusBadge({ line }: { line: ShortagePOLine }) {
  const key = getProcurementDisplayStatus(line)
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
        key === 'done' ? 'bg-pale-stone/30 text-muted' : 'bg-atmosphere-wash text-ink'
      }`}
    >
      {PROCUREMENT_LINE_STATUS_LABEL[key]}
    </span>
  )
}

export function ProcurementModeBadge({ mode }: { mode: ProcurementMode }) {
  return (
    <span className="inline-block rounded-full bg-segment-track px-2 py-0.5 text-[10px] font-medium text-ink">
      {PROCUREMENT_MODE_LABEL[mode]}
    </span>
  )
}
