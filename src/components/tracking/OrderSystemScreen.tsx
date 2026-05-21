import { MOCK_PARSED_ORDER } from '../../mocks/parsedOrder'
import { useWorkflowStore } from '../../store/workflowStore'
import { TrackingLaunchView, TrackingLoginView } from './TrackingLaunchView'

function Field({
  label,
  value,
  active,
  edited,
}: {
  label: string
  value: string
  active?: boolean
  edited?: boolean
}) {
  return (
    <div className="mb-2">
      <label className="mb-0.5 block text-[10px] text-muted">{label}</label>
      <div
        className={`rounded border px-2 py-1.5 text-xs text-ink transition-colors ${
          active
            ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
            : edited
              ? 'border-[#F59E0B] bg-[#FFFBEB] ring-1 ring-[#FCD34D]/60'
              : value
                ? 'border-[#C6C6C8] bg-white'
                : 'border-dashed border-[#D1D1D6] bg-[#FAFAFA] text-muted'
        }`}
      >
        {value || '—'}
        {active && (
          <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-ink align-middle" />
        )}
      </div>
    </div>
  )
}

export function OrderSystemScreen() {
  const screen = useWorkflowStore((s) => s.trackingScreen)
  const pendingOrder = useWorkflowStore((s) => s.pendingOrder)
  const phase = useWorkflowStore((s) => s.phase)
  const salesOrder = useWorkflowStore((s) => s.salesOrder)

  const lines = pendingOrder?.lines ?? MOCK_PARSED_ORDER.lines
  const visibleCount = pendingOrder
    ? lines.length
    : screen.tableRowsVisible || lines.length
  const f = screen.filledFields
  const editedSkus = new Set(screen.highlightedSkus ?? [])

  const hotel = pendingOrder?.hotelName ?? f.hotelName ?? ''
  const contact = pendingOrder?.contact ?? f.contact ?? ''
  const orderId = pendingOrder?.id ?? f.orderId ?? '（新建）'
  const hotelEdited = Boolean(screen.headerEdited)
  const view = screen.view ?? 'app'

  if (view === 'launch') return <TrackingLaunchView system="order" />
  if (view === 'login') return <TrackingLoginView system="order" />

  return (
    <div className="flex min-h-full flex-col bg-[#F5F6FA] text-ink">
      <div className="flex shrink-0 items-center gap-1 border-b border-[#1E5BB8] bg-[#1E5BB8] px-2 py-1.5 text-[10px] text-white">
        <span className="font-semibold">金龙鱼</span>
        <span>订单管理系统 OMS</span>
        <span className="ml-auto opacity-80">
          {phase === 'convertingSales' || salesOrder ? '销售订单' : '订单'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div
          className={`flex min-h-0 flex-1 flex-col rounded bg-white p-2 shadow-sm ${
            screen.flashSave ? 'ring-2 ring-accent/40' : ''
          }`}
        >
        <div className="mb-2 flex gap-1 border-b border-[#E5E5EA] pb-1 text-[10px]">
          <span className="rounded-t bg-[#1E5BB8] px-2 py-0.5 text-white">基本信息</span>
          <span className="px-2 py-0.5 text-muted">行项目</span>
          <span className="px-2 py-0.5 text-muted">附件</span>
        </div>

        <Field label="单据编号" value={orderId} />
        <Field
          label="酒店/客户"
          value={hotel}
          active={screen.activeField === 'hotelName'}
          edited={hotelEdited && screen.activeField !== 'hotelName'}
        />
        <Field label="联系人" value={contact} active={screen.activeField === 'contact'} />

        <p className="mb-1 mt-2 text-[10px] font-medium text-muted">行项目明细</p>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-[#EEF2F8] text-left text-muted">
              <th className="border border-[#DDE3EC] px-1 py-0.5">SKU</th>
              <th className="border border-[#DDE3EC] px-1 py-0.5">品名</th>
              <th className="border border-[#DDE3EC] px-1 py-0.5">数量</th>
            </tr>
          </thead>
          <tbody>
            {lines.slice(0, visibleCount || lines.length).map((line, i) => {
              const rowEdited = editedSkus.has(line.sku)
              const rowActive = screen.activeField === `line-${i}`
              return (
              <tr
                key={line.sku}
                className={
                  rowActive
                    ? 'bg-accent/10'
                    : rowEdited
                      ? 'bg-[#FFFBEB] ring-1 ring-inset ring-[#FCD34D]/50'
                      : i % 2 === 0
                        ? 'bg-white'
                        : 'bg-[#FAFBFC]'
                }
              >
                <td className="border border-[#DDE3EC] px-1 py-0.5 font-mono">{line.sku}</td>
                <td className="border border-[#DDE3EC] px-1 py-0.5">{line.name}</td>
                <td
                  className={`border border-[#DDE3EC] px-1 py-0.5 ${
                    rowEdited ? 'font-semibold text-[#B45309]' : ''
                  }`}
                >
                  {line.quantity}
                  {line.unit}
                </td>
              </tr>
            )})}
            {visibleCount === 0 && (
              <tr>
                <td colSpan={3} className="border border-[#DDE3EC] px-1 py-3 text-center text-muted">
                  等待录入…
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-auto flex justify-end gap-1 pt-2">
          <span className="rounded border border-[#C6C6C8] px-2 py-0.5 text-[10px] text-muted">
            保存草稿
          </span>
          <span
            className={`rounded px-2 py-0.5 text-[10px] text-white ${
              screen.flashSave ? 'bg-accent' : 'bg-[#1E5BB8]'
            }`}
          >
            提交
          </span>
        </div>
        </div>
      </div>
    </div>
  )
}
