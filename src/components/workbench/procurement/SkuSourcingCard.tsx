import { useState } from 'react'
import type { ProcurementSkuGroup } from '../../../types/shortage'
import { SkuHotelSubTable } from './SkuHotelSubTable'

export function SkuSourcingCard({ group }: { group: ProcurementSkuGroup }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-card border border-pale-stone/15 bg-card shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-pale-stone/10 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{group.productName}</h3>
            <span className="font-mono text-[10px] text-muted">{group.sku}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            总还缺 {group.totalGap}
            {group.unit} · {group.hotelCount} 家酒店 · 最早送达 {group.earliestRequiredDate} · 最迟{' '}
            {group.latestRequiredDate}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-muted"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>
      {expanded && (
        <div className="overflow-x-auto p-3">
          <SkuHotelSubTable rows={group.hotelRows} />
        </div>
      )}
    </div>
  )
}
