import { useMemo } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { groupByHotel } from '../../../utils/shortageAggregations'
import { ProgressBar } from '../shared/ProgressBar'
import { HotelCompleteBanner } from '../shared/HotelCompleteBanner'
import { HotelShortageProducts } from './HotelShortageProducts'

export function HotelList() {
  const orders = useShortageStore((s) => s.orders)
  const selectHotel = useShortageStore((s) => s.selectHotel)
  const groups = useMemo(() => groupByHotel(orders), [orders])

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-ink">缺货沟通总览</h2>
      <div className="space-y-4">
        {groups.map((g) => (
          <div
            key={g.hotelKey}
            className="rounded-card border border-pale-stone/15 bg-card p-4 shadow-soft"
          >
            {g.isComplete && <HotelCompleteBanner hotelName={g.hotelName} />}
            {!g.isComplete && (
              <div
                className="mb-3 flex cursor-pointer items-start justify-between gap-2"
                onClick={() => selectHotel(g.hotelKey)}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ink">{g.hotelName}</h3>
                  <p className="mt-1 text-xs text-muted">
                    缺货 {g.shortageLineCount} 品 · {g.completedCount} 已履约 · 最近出货{' '}
                    {g.nearestDeliveryDate}
                  </p>
                  <ProgressBar value={g.completionRate} className="mt-2 max-w-xs" />
                </div>
                <span className="shrink-0 text-xs text-off-black">详情 →</span>
              </div>
            )}
            {g.isComplete && (
              <h3 className="mb-2 text-sm font-semibold text-ink">{g.hotelName}</h3>
            )}
            <HotelShortageProducts lines={g.lines} showInlineRegister />
          </div>
        ))}
      </div>
    </div>
  )
}
