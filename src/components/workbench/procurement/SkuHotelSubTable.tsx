import type { SkuHotelSubRow } from '../../../types/shortage'
import { SalesUrgencyBadge, ProcurementLineStatusBadge } from '../shared/LineStatusBadge'
import { useShortageStore } from '../../../store/shortageStore'
import { getProcurementDisplayStatus } from '../../../utils/shortageAggregations'

export function SkuHotelSubTable({ rows }: { rows: SkuHotelSubRow[] }) {
  const orders = useShortageStore((s) => s.orders)
  const openSupplyDialog = useShortageStore((s) => s.openSupplyDialog)
  const selectPo = useShortageStore((s) => s.selectPo)
  const setNav = useShortageStore((s) => s.setNav)

  const lineById = (lineId: string) =>
    orders.flatMap((o) => o.lines).find((l) => l.id === lineId)

  return (
    <table className="w-full min-w-[640px] text-left text-xs">
      <thead>
        <tr className="text-muted">
          <th className="px-2 py-1.5 font-medium">酒店/客户</th>
          <th className="px-2 py-1.5 font-medium">还缺</th>
          <th className="px-2 py-1.5 font-medium">要求送达</th>
          <th className="px-2 py-1.5 font-medium">距今</th>
          <th className="px-2 py-1.5 font-medium">客户要求</th>
          <th className="px-2 py-1.5 font-medium">缺货单号</th>
          <th className="px-2 py-1.5 font-medium">状态</th>
          <th className="px-2 py-1.5 font-medium" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const line = lineById(row.lineId)
          const procStatus = line ? getProcurementDisplayStatus(line) : 'pending_input'
          return (
            <tr key={row.lineId} className="border-t border-pale-stone/10">
              <td className="px-2 py-2 font-medium">{row.hotelName}</td>
              <td className="px-2 py-2 font-semibold">
                {row.gap}
                {row.unit}
              </td>
              <td className="px-2 py-2">{row.requiredDeliveryDate}</td>
              <td className={`px-2 py-2 ${row.daysRemaining <= 2 ? 'font-semibold text-off-black' : ''}`}>
                {row.daysRemaining < 0 ? `逾期 ${-row.daysRemaining} 天` : `剩 ${row.daysRemaining} 天`}
              </td>
              <td className="px-2 py-2">
                <SalesUrgencyBadge urgency={row.salesUrgency} />
              </td>
              <td className="px-2 py-2">
                <button
                  type="button"
                  className="font-mono text-off-black underline"
                  onClick={() => {
                    setNav('home')
                    selectPo(row.poId)
                  }}
                >
                  {row.poId}
                </button>
              </td>
              <td className="px-2 py-2">
                {line ? <ProcurementLineStatusBadge line={line} /> : null}
              </td>
              <td className="px-2 py-2">
                {procStatus === 'pending_input' && (
                  <button
                    type="button"
                    className="text-off-black underline"
                    onClick={() => openSupplyDialog({ lineId: row.lineId })}
                  >
                    录入方案
                  </button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
