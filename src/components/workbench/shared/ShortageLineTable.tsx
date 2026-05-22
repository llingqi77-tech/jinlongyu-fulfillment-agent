import type { ShortagePO, ShortagePOLine } from '../../../types/shortage'
import { getFulfillmentStageLabel } from '../../../constants/shortageLabels'

function FulfillmentStageBadge({ line }: { line: ShortagePOLine }) {
  const label = getFulfillmentStageLabel(line)
  const style =
    label === '待销售确认' ? 'bg-atmosphere-wash text-muted' : 'bg-atmosphere-wash text-ink'

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${style}`}>
      {label}
    </span>
  )
}

interface ShortageLineTableProps {
  po: ShortagePO
  lines?: ShortagePOLine[]
  showActions?: boolean
  onSelectLine?: (lineId: string) => void
}

export function ShortageLineTable({
  po,
  lines,
  onSelectLine,
}: ShortageLineTableProps) {
  const displayLines = lines ?? po.lines.filter((l) => l.isShortage)

  return (
    <div className="overflow-x-auto rounded-card border border-pale-stone/15">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead>
          <tr className="bg-segment-track/80 text-muted">
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">产品</th>
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">数量</th>
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">单价</th>
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">金额</th>
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">库存</th>
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">还缺</th>
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">履约状态</th>
            <th className="border-b border-pale-stone/15 px-3 py-2 font-medium">采购方案</th>
          </tr>
        </thead>
        <tbody>
          {displayLines.map((line) => (
            <tr
              key={line.id}
              className={`border-b border-pale-stone/10 ${
                line.gap > 0 ? 'bg-atmosphere-wash/30' : 'bg-paper-canvas'
              } ${onSelectLine ? 'cursor-pointer hover:bg-segment-track/50' : ''}`}
              onClick={() => onSelectLine?.(line.id)}
            >
              <td className="px-3 py-2">
                <p className="font-medium text-ink">{line.productName}</p>
                <p className="font-mono text-[10px] text-muted">{line.sku}</p>
              </td>
              <td className="px-3 py-2">
                {line.quantity}
                {line.unit}
              </td>
              <td className="px-3 py-2">¥{line.unitPrice}</td>
              <td className="px-3 py-2">¥{line.lineAmount.toLocaleString()}</td>
              <td className="px-3 py-2">{line.availableStock}</td>
              <td className="px-3 py-2 font-semibold text-off-black">
                {line.gap}
                {line.unit}
              </td>
              <td className="px-3 py-2">
                <FulfillmentStageBadge line={line} />
                {line.salesNote && (
                  <p className="mt-1 max-w-[140px] truncate text-[10px] text-muted">{line.salesNote}</p>
                )}
              </td>
              <td className="px-3 py-2">
                {line.supplierName ? (
                  <p className="font-medium">
                    {line.supplierName}
                    <span className="ml-2 text-muted">¥{line.amount.toLocaleString()}</span>
                  </p>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
