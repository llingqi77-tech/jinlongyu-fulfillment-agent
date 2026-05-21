import type { ShortageLine } from '../../types/workflow'

interface ShortageTableProps {
  lines: ShortageLine[]
}

export function ShortageTable({ lines }: ShortageTableProps) {
  const shortageOnly = lines.filter((l) => l.gap > 0)

  return (
    <div className="overflow-hidden rounded-card border border-[var(--color-chat-primary-light)] bg-card shadow-soft">
      <div className="border-b border-[var(--color-chat-primary-light)] bg-[var(--color-chat-primary-light)]/30 px-3 py-2">
        <h4 className="text-sm font-semibold text-ink">缺货信息表</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-2 py-2 font-medium">SKU</th>
              <th className="px-2 py-2 font-medium">品名</th>
              <th className="px-2 py-2 font-medium">需求</th>
              <th className="px-2 py-2 font-medium">库存</th>
              <th className="px-2 py-2 font-medium text-red-600">缺口</th>
            </tr>
          </thead>
          <tbody>
            {shortageOnly.map((line) => (
              <tr key={line.sku} className="border-b border-border/60 last:border-0">
                <td className="px-2 py-2 font-mono text-[11px]">{line.sku}</td>
                <td className="max-w-[80px] truncate px-2 py-2">{line.name}</td>
                <td className="px-2 py-2">{line.required}</td>
                <td className="px-2 py-2">{line.available}</td>
                <td className="px-2 py-2 font-medium text-red-600">{line.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shortageOnly.length === 0 && (
        <p className="px-3 py-4 text-center text-sm text-muted">暂无缺货 SKU</p>
      )}
    </div>
  )
}
