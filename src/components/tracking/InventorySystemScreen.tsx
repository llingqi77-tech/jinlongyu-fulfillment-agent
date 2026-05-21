import { MOCK_SHORTAGE_LINES } from '../../mocks/parsedOrder'
import { useWorkflowStore } from '../../store/workflowStore'
import { TrackingLaunchView, TrackingLoginView } from './TrackingLaunchView'

export function InventorySystemScreen() {
  const screen = useWorkflowStore((s) => s.trackingScreen)
  const shortageLines = useWorkflowStore((s) => s.shortageLines) ?? MOCK_SHORTAGE_LINES
  const visible = screen.tableRowsVisible || shortageLines.length
  const view = screen.view ?? 'app'

  if (view === 'launch') return <TrackingLaunchView system="inventory" />
  if (view === 'login') return <TrackingLoginView system="inventory" />

  return (
    <div className="flex min-h-full flex-col bg-paper-canvas text-ink">
      <div className="flex shrink-0 items-center gap-1 bg-off-black px-2 py-1.5 text-[10px] text-paper-canvas">
        <span className="font-semibold">WMS</span>
        <span>库存管理系统</span>
        <span className="ml-auto">华北仓 · 实时</span>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-1 p-2 pb-0 text-center text-[10px]">
        {['总SKU', '可用', '缺货'].map((label, i) => (
          <div key={label} className="rounded-card bg-atmosphere-wash/40 py-1.5 shadow-soft">
            <p className="text-muted">{label}</p>
            <p className="font-semibold text-ink">
              {i === 0 ? visible : i === 1 ? visible - screen.highlightedSkus.length : screen.highlightedSkus.length}
            </p>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2 pt-2">
      <table className="w-full flex-1 border-collapse bg-paper-canvas text-[10px] shadow-soft">
        <thead>
          <tr className="bg-atmosphere-wash/60 text-left text-muted">
            <th className="border border-pale-stone/25 px-1 py-1">SKU</th>
            <th className="border border-pale-stone/25 px-1 py-1">需求</th>
            <th className="border border-pale-stone/25 px-1 py-1">可用</th>
            <th className="border border-pale-stone/25 px-1 py-1">缺口</th>
          </tr>
        </thead>
        <tbody>
          {shortageLines.slice(0, visible).map((line) => {
            const isShort = screen.highlightedSkus.includes(line.sku)
            return (
              <tr
                key={line.sku}
                className={
                  isShort
                    ? 'animate-pulse bg-atmosphere-wash'
                    : line.gap === 0
                      ? 'bg-paper-canvas'
                      : 'bg-atmosphere-wash/30'
                }
              >
                <td className="border border-pale-stone/25 px-1 py-0.5 font-mono">{line.sku}</td>
                <td className="border border-pale-stone/25 px-1 py-0.5">{line.required}</td>
                <td className="border border-pale-stone/25 px-1 py-0.5">{line.available}</td>
                <td
                  className={`border border-pale-stone/25 px-1 py-0.5 font-medium ${
                    line.gap > 0 ? 'text-pale-stone' : 'text-ink'
                  }`}
                >
                  {line.gap > 0 ? line.gap : '✓'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
