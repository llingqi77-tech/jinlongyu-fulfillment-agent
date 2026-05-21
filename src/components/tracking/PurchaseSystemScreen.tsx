import { useWorkflowStore } from '../../store/workflowStore'
import { TrackingLaunchView, TrackingLoginView } from './TrackingLaunchView'

function Field({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active?: boolean
}) {
  return (
    <div className="mb-2">
      <label className="mb-0.5 block text-[10px] text-muted">{label}</label>
      <div
        className={`rounded border px-2 py-1.5 text-xs ${
          active
            ? 'border-[#E67E22] bg-orange-50 ring-1 ring-orange-200'
            : 'border-[#D1D1D6] bg-white'
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

export function PurchaseSystemScreen() {
  const screen = useWorkflowStore((s) => s.trackingScreen)
  const purchaseOrder = useWorkflowStore((s) => s.purchaseOrder)
  const draft = useWorkflowStore((s) => s.purchaseDraft)
  const salesOrder = useWorkflowStore((s) => s.salesOrder)
  const f = screen.filledFields

  const supplier = f.supplier ?? draft?.supplier ?? purchaseOrder?.supplier ?? ''
  const amount = f.amount ?? (draft?.amount ? `¥${draft.amount.toLocaleString()}` : purchaseOrder ? `¥${purchaseOrder.amount.toLocaleString()}` : '')
  const poId = purchaseOrder?.id ?? '（新建）'
  const view = screen.view ?? 'app'

  if (view === 'launch') return <TrackingLaunchView system="purchase" />
  if (view === 'login') return <TrackingLoginView system="purchase" />

  return (
    <div className="flex min-h-full flex-col bg-[#FAF7F2] text-ink">
      <div className="flex shrink-0 items-center gap-1 bg-[#B45309] px-2 py-1.5 text-[10px] text-white">
        <span className="font-semibold">SRM</span>
        <span>采购管理系统</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2">
      <div
        className={`flex min-h-0 flex-1 flex-col rounded bg-white p-2 shadow-sm ${
          screen.flashSave ? 'ring-2 ring-[#E67E22]/40' : ''
        }`}
      >
        <Field label="采购单号" value={poId} />
        <Field label="供应商" value={supplier} active={screen.activeField === 'supplier'} />
        <Field label="采购金额" value={amount} active={screen.activeField === 'amount'} />
        <Field label="采购类型" value="紧急补货" />
        <Field label="关联销售单" value={salesOrder?.id ?? '—'} />

        <div className="mt-auto flex justify-end pt-2">
          <span
            className={`rounded px-3 py-1 text-[10px] text-white ${
              screen.flashSave ? 'bg-[#E67E22]' : 'bg-[#B45309]'
            }`}
          >
            提交审批
          </span>
        </div>
      </div>
      </div>
    </div>
  )
}
