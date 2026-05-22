import { useMemo } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import { groupByHotel } from '../../../utils/shortageAggregations'
import { ProgressBar } from '../shared/ProgressBar'
import { HotelCompleteBanner } from '../shared/HotelCompleteBanner'
import { HotelShortageProducts } from './HotelShortageProducts'

export function HotelDetail({ hotelKey }: { hotelKey: string }) {
  const orders = useShortageStore((s) => s.orders)
  const selectHotel = useShortageStore((s) => s.selectHotel)
  const group = useMemo(() => groupByHotel(orders).find((g) => g.hotelKey === hotelKey), [orders, hotelKey])

  if (!group) return <p className="text-sm text-muted">酒店不存在</p>

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="text-xs text-muted hover:text-ink"
        onClick={() => selectHotel(null)}
      >
        ← 返回酒店列表
      </button>

      {group.isComplete && <HotelCompleteBanner hotelName={group.hotelName} />}

      <div className="rounded-card border border-pale-stone/15 bg-card p-4">
        <h2 className="text-base font-semibold text-ink">{group.hotelName}</h2>
        <p className="mt-1 text-xs text-muted">
          共 {group.shortageLineCount} 个缺货品 · 履约进度 {group.completionRate}%
        </p>
        <ProgressBar value={group.completionRate} className="mt-2 max-w-md" />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">缺货品项与沟通结论</h3>
        <p className="mb-3 text-xs text-muted">
          每一行独立登记客户沟通结论，采购将按品分别寻源。
        </p>
        <HotelShortageProducts lines={group.lines} showInlineRegister />
      </div>
    </div>
  )
}
