import { useMemo } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import {
  getProcurementDisplayStatus,
  getShortageLines,
  groupBySku,
  isLineVisibleToProcurement,
} from '../../../utils/shortageAggregations'
import { ShortagePoDetail } from '../po/ShortagePoDetail'
import { GeneratePoConfirm } from '../ops/GeneratePoConfirm'
import { SkuSourcingCard } from '../procurement/SkuSourcingCard'
import { SupplyPlanDialog } from '../procurement/SupplyPlanDialog'

export function TaskInbox() {
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
  const selectedPoId = useShortageStore((s) => s.selectedPoId)
  const selectedSku = useShortageStore((s) => s.selectedSku)
  const selectPo = useShortageStore((s) => s.selectPo)
  const selectSku = useShortageStore((s) => s.selectSku)

  const tasks = useMemo(() => {
    const lines = getShortageLines(orders)
    if (role === 'sales') {
      return lines
        .filter((l) => l.salesUrgency === 'pending')
        .map((l) => ({
          id: l.id,
          title: `${l.po.customerName} · ${l.productName}`,
          sub: '待登记客户沟通结论',
          action: () => selectPo(l.po.id),
        }))
    }
    if (role === 'procurement') {
      return lines
        .filter(
          (l) =>
            isLineVisibleToProcurement(l) && getProcurementDisplayStatus(l) === 'pending_input'
        )
        .map((l) => ({
          id: l.id,
          title: `${l.productName} · ${l.po.customerName}`,
          sub: `还缺 ${l.gap}${l.unit} · 出货 ${l.po.requiredDeliveryDate}`,
          action: () => selectSku(l.sku),
        }))
    }
    return lines
      .filter((l) => l.status === 'ready_for_po')
      .map((l) => ({
        id: l.id,
        title: `${l.po.id} · ${l.productName}`,
        sub: '可生成采购订单',
        action: () => selectPo(l.po.id),
      }))
  }, [orders, role, selectPo, selectSku])

  const skuGroup = useMemo(
    () => (selectedSku ? groupBySku(orders).find((g) => g.sku === selectedSku) : undefined),
    [orders, selectedSku]
  )

  if (selectedPoId && (role === 'ops' || role === 'sales')) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="text-xs text-muted hover:text-ink"
          onClick={() => selectPo(null)}
        >
          ← 返回任务列表
        </button>
        <ShortagePoDetail poId={selectedPoId} />
        {role === 'ops' && <GeneratePoConfirm />}
      </div>
    )
  }

  if (selectedSku && role === 'procurement' && skuGroup) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="text-xs text-muted hover:text-ink"
          onClick={() => selectSku(null)}
        >
          ← 返回任务列表
        </button>
        <SkuSourcingCard group={skuGroup} />
        <SupplyPlanDialog />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-ink">我的任务</h2>
      <p className="text-xs text-muted">
        {role === 'ops' && '待生成采购订单的缺货行'}
        {role === 'sales' && '待客户沟通的缺货行'}
        {role === 'procurement' && '待寻源报价的缺货行'}
      </p>
      <ul className="space-y-2">
        {tasks.length === 0 && (
          <li className="rounded-card border border-pale-stone/15 px-4 py-6 text-center text-sm text-muted">
            暂无待办
          </li>
        )}
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex cursor-pointer items-center justify-between rounded-card border border-pale-stone/15 bg-card px-4 py-3 hover:bg-segment-track/40"
            onClick={t.action}
          >
            <div>
              <p className="text-sm font-medium text-ink">{t.title}</p>
              <p className="text-xs text-muted">{t.sub}</p>
            </div>
            <span className="text-off-black">→</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
