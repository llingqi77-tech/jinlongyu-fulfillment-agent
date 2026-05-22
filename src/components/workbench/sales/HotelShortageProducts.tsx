import { Fragment, useState } from 'react'
import type { SalesHotelLineItem } from '../../../types/shortage'
import { SalesCommunicationBadge } from '../shared/LineStatusBadge'
import { SalesIntentForm } from './SalesIntentForm'

export function HotelShortageProducts({
  lines,
  showInlineRegister = false,
}: {
  lines: SalesHotelLineItem[]
  /** 列表页：点击「登记」在行内展开表单 */
  showInlineRegister?: boolean
}) {
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

  if (lines.length === 0) {
    return <p className="text-xs text-muted">暂无缺货品项</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-pale-stone/15">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="bg-segment-track/60 text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">品名</th>
            <th className="px-3 py-2 font-medium">还缺</th>
            <th className="px-3 py-2 font-medium">要求送达</th>
            <th className="px-3 py-2 font-medium">缺货单号</th>
            <th className="px-3 py-2 font-medium">沟通结论</th>
            {showInlineRegister && <th className="px-3 py-2 font-medium" />}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <Fragment key={line.lineId}>
              <tr className="border-t border-pale-stone/10">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{line.productName}</p>
                  <p className="text-[10px] text-muted">
                    {line.spec} · {line.sku}
                  </p>
                </td>
                <td className="px-3 py-2.5 font-semibold text-off-black">
                  {line.gap}
                  {line.unit}
                </td>
                <td className="px-3 py-2.5">{line.requiredDeliveryDate}</td>
                <td className="px-3 py-2.5 font-mono text-[10px]">{line.poId}</td>
                <td className="px-3 py-2.5">
                  <SalesCommunicationBadge urgency={line.salesUrgency} />
                  {line.salesNote && (
                    <p className="mt-1 max-w-[160px] text-[10px] text-muted">{line.salesNote}</p>
                  )}
                </td>
                {showInlineRegister && (
                  <td className="px-3 py-2.5">
                    {line.salesUrgency === 'pending' && (
                      <button
                        type="button"
                        className="text-off-black underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingLineId(editingLineId === line.lineId ? null : line.lineId)
                        }}
                      >
                        {editingLineId === line.lineId ? '收起' : '登记'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
              {showInlineRegister &&
                editingLineId === line.lineId &&
                line.salesUrgency === 'pending' && (
                  <tr className="border-t border-pale-stone/10 bg-atmosphere-wash/20">
                    <td colSpan={6} className="px-3 py-3">
                      <SalesIntentForm
                        lineId={line.lineId}
                        onSaved={() => setEditingLineId(null)}
                      />
                    </td>
                  </tr>
                )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
