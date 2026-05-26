import type { ShortagePO, ShortagePOLine } from '../../../types/shortage'
import { getFulfillmentStageLabel } from '../../../constants/shortageLabels'

function FulfillmentStageBadge({ line }: { line: ShortagePOLine }) {
  const label = getFulfillmentStageLabel({
    fulfillmentMethod: line.fulfillmentMethod,
    opsAdvice: line.opsAdvice,
    procurementConfirmed: line.procurementConfirmed,
  })
  const style =
    label === '待销售确认'
      ? 'bg-fire-orange/10 text-fire-orange'
      : label === '待采购寻源'
        ? 'bg-brand-muted text-brand-dark'
        : 'bg-paper-white text-ink border border-tech'

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${style}`}>
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

export function ShortageLineTable({ po, lines, onSelectLine }: ShortageLineTableProps) {
  const displayLines = lines ?? po.lines.filter((l) => l.isShortage)

  return (
    <div className="overflow-x-auto rounded-2xl border border-tech bg-paper-white shadow-card">
      <table className="w-full min-w-[640px] border-collapse text-left text-body-sm">
        <thead>
          <tr className="border-b border-tech bg-paper-white">
            <th className="px-3 py-2.5 font-mono text-caption font-medium uppercase tracking-wide text-muted">
              产品
            </th>
            <th className="px-3 py-2.5 text-caption font-medium uppercase tracking-wide text-muted">
              数量
            </th>
            <th className="px-3 py-2.5 text-caption font-medium uppercase tracking-wide text-muted">
              单价
            </th>
            <th className="px-3 py-2.5 text-caption font-medium uppercase tracking-wide text-muted">
              金额
            </th>
            <th className="px-3 py-2.5 text-caption font-medium uppercase tracking-wide text-muted">
              库存
            </th>
            <th className="px-3 py-2.5 text-caption font-medium uppercase tracking-wide text-muted">
              还缺
            </th>
            <th className="px-3 py-2.5 text-caption font-medium uppercase tracking-wide text-muted">
              履约状态
            </th>
            <th className="px-3 py-2.5 text-caption font-medium uppercase tracking-wide text-muted">
              采购方案
            </th>
          </tr>
        </thead>
        <tbody>
          {displayLines.map((line) => (
            <tr
              key={line.id}
              className={`border-b border-tech transition-colors last:border-0 ${
                onSelectLine ? 'cursor-pointer hover:bg-white' : ''
              }`}
              onClick={() => onSelectLine?.(line.id)}
            >
              <td className="px-3 py-2.5">
                <p className="font-medium text-ink">{line.productName}</p>
                <p className="font-mono text-caption text-muted">{line.sku}</p>
              </td>
              <td className="px-3 py-2.5 font-mono text-caption">
                {line.quantity}
                {line.unit}
              </td>
              <td className="px-3 py-2.5">¥{line.unitPrice}</td>
              <td className="px-3 py-2.5">¥{line.lineAmount.toLocaleString()}</td>
              <td className="px-3 py-2.5">{line.availableStock}</td>
              <td className="px-3 py-2.5 font-mono font-semibold text-fire-orange">
                {line.gap}
                {line.unit}
              </td>
              <td className="px-3 py-2.5">
                <FulfillmentStageBadge line={line} />
                {line.salesNote && (
                  <p className="mt-1 max-w-[140px] truncate text-caption text-muted">{line.salesNote}</p>
                )}
              </td>
              <td className="px-3 py-2.5">
                {line.supplierName ? (
                  <p className="font-medium">
                    {line.supplierName}
                    <span className="ml-2 font-mono text-caption text-muted">
                      ¥{line.amount.toLocaleString()}
                    </span>
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
