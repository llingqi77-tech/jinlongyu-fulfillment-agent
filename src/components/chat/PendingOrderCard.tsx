import type { PendingOrder } from '../../types/workflow'

interface PendingOrderCardProps {
  order: PendingOrder
}

export function PendingOrderCard({ order }: PendingOrderCardProps) {
  return (
    <div className="overflow-hidden rounded-card border border-[var(--color-chat-primary-light)] bg-card shadow-soft">
      <div className="border-b border-[var(--color-chat-primary-light)] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-ink">待转单</h4>
          <span className="font-mono text-[11px] text-muted">{order.id}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {order.hotelName} · {order.contact}
        </p>
      </div>
      <ul className="divide-y divide-border/60">
        {order.lines.map((line) => (
          <li key={line.sku} className="flex items-start justify-between gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{line.name}</p>
              <p className="text-[11px] text-muted">
                {line.sku} · {line.spec}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium text-ink">
              {line.quantity} {line.unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
