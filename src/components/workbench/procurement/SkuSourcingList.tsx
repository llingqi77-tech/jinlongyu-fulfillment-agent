import { useMemo, useState } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { filterSkuGroupMustOnTime, groupBySku } from '../../../utils/shortageAggregations'
import { SkuSourcingCard } from './SkuSourcingCard'

export function SkuSourcingList() {
  const orders = useShortageStore((s) => s.orders)
  const [filterUrgent, setFilterUrgent] = useState(false)
  const groups = useMemo(() => {
    const all = groupBySku(orders)
    if (!filterUrgent) return all
    return all
      .map((g) => filterSkuGroupMustOnTime(g))
      .filter((g): g is NonNullable<typeof g> => g !== null)
  }, [orders, filterUrgent])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">缺货寻源总览</h2>
        <label className="flex items-center gap-2 text-xs text-ink">
          <input
            type="checkbox"
            checked={filterUrgent}
            onChange={(e) => setFilterUrgent(e.target.checked)}
          />
          仅当期必到
        </label>
      </div>
      <div className="space-y-3">
        {groups.length === 0 && (
          <p className="rounded-card border border-pale-stone/15 px-4 py-6 text-center text-sm text-muted">
            {filterUrgent ? '暂无当期必到的缺货品' : '暂无待寻源缺货品'}
          </p>
        )}
        {groups.map((g) => (
          <SkuSourcingCard key={g.sku} group={g} />
        ))}
      </div>
    </div>
  )
}
