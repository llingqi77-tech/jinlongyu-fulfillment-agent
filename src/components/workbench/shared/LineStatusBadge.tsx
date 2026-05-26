import type {
  FulfillmentMethod,
  ProcurementMode,
  ShortageLineStatus,
  ShortagePOLine,
} from '../../../types/shortage'
import {
  FULFILLMENT_METHOD_LABEL,
  getSalesCommunicationLabel,
  LINE_STATUS_LABEL,
  PROCUREMENT_LINE_STATUS_LABEL,
  PROCUREMENT_MODE_LABEL,
} from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import { getProcurementDisplayStatus } from '../../../utils/shortageAggregations'

export function LineStatusBadge({ status }: { status: ShortageLineStatus }) {
  const colors: Record<ShortageLineStatus, string> = {
    new: 'bg-cloud-canvas text-muted',
    await_ops: 'bg-cloud-canvas text-ink',
    await_sales: 'bg-fire-orange/10 text-fire-orange',
    await_procurement: 'bg-brand-muted text-brand-dark',
    await_logistics: 'bg-paper-white text-ink border border-tech',
    ready_for_po: 'bg-fire-orange text-white',
    completed: 'bg-cloud-canvas text-muted',
    cancelled: 'bg-cloud-canvas text-muted',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${colors[status]}`}>
      {LINE_STATUS_LABEL[status]}
    </span>
  )
}

export function SalesCommunicationBadge({ method }: { method: FulfillmentMethod }) {
  const label = getSalesCommunicationLabel(method)
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${
        label === '待确认' ? 'bg-fire-orange/10 text-fire-orange' : 'bg-cloud-canvas text-muted'
      }`}
    >
      {label}
    </span>
  )
}

export function FulfillmentMethodBadge({ method }: { method: FulfillmentMethod }) {
  const role = useShortageStore((s) => s.role)
  const urgent = method === 'must_on_time'
  const label =
    method === 'pending' && role === 'sales' ? '待确认' : FULFILLMENT_METHOD_LABEL[method]
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${
        urgent
          ? 'bg-fire-orange text-white'
          : method === 'pending'
            ? 'bg-fire-orange/10 text-fire-orange'
            : 'bg-paper-white text-ink border border-tech'
      }`}
    >
      {label}
    </span>
  )
}

export const SalesUrgencyBadge = FulfillmentMethodBadge

export function ProcurementLineStatusBadge({ line }: { line: ShortagePOLine }) {
  const key = getProcurementDisplayStatus(line)
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${
        key === 'done' ? 'bg-cloud-canvas text-muted' : 'bg-brand-muted text-brand-dark'
      }`}
    >
      {PROCUREMENT_LINE_STATUS_LABEL[key]}
    </span>
  )
}

export function ProcurementModeBadge({ mode }: { mode: ProcurementMode }) {
  return (
    <span className="inline-block rounded-full border border-tech bg-paper-white px-2 py-0.5 text-caption font-medium text-ink">
      {PROCUREMENT_MODE_LABEL[mode]}
    </span>
  )
}
