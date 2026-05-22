export function HotelCompleteBanner({ hotelName }: { hotelName: string }) {
  return (
    <div className="rounded-card border-2 border-off-black/20 bg-atmosphere-wash/50 px-4 py-3 text-sm font-medium text-ink">
      {hotelName} 今日缺货已全部处理完毕
    </div>
  )
}
