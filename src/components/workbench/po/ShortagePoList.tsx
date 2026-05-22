import { useMemo } from 'react'
import type { OpsListFilter } from '../../../types/shortage'
import { OPS_LIST_FILTER_LABEL } from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import { getTodayStats, lineMatchesOpsFilter, poMatchesOpsFilter } from '../../../utils/shortageAggregations'
import { LineStatusBadge } from '../shared/LineStatusBadge'

const STAT_CARDS: { filter: OpsListFilter; label: string; statKey: keyof ReturnType<typeof getTodayStats> }[] = [
  { filter: 'await_sales', label: '待销售沟通', statKey: 'awaitSales' },
  { filter: 'await_procurement', label: '待采购寻源', statKey: 'awaitProcurement' },
  { filter: 'ready_for_po', label: '待生成采购订单', statKey: 'readyForPo' },
  { filter: 'completed', label: '已履约', statKey: 'completed' },
]

function countShortageSkus(lines: ReturnType<typeof useShortageStore.getState>['orders'][0]['lines']) {
  return new Set(lines.filter((l) => l.isShortage).map((l) => l.sku)).size
}

function poProgress(po: ReturnType<typeof useShortageStore.getState>['orders'][0]) {
  const lines = po.lines.filter((l) => l.isShortage)
  const salesDone = lines.filter((l) => l.salesUrgency !== 'pending').length
  const procDone = lines.filter((l) => l.procurementMode !== 'pending').length
  const ready = lines.filter((l) => l.status === 'ready_for_po').length
  return { salesDone, procDone, ready, total: lines.length }
}

export function ShortagePoList() {
  const orders = useShortageStore((s) => s.orders)
  const opsListFilter = useShortageStore((s) => s.opsListFilter)
  const goToOpsFilteredList = useShortageStore((s) => s.goToOpsFilteredList)
  const clearOpsListFilter = useShortageStore((s) => s.clearOpsListFilter)
  const selectPo = useShortageStore((s) => s.selectPo)
  const stats = getTodayStats(orders)

  const visibleOrders = useMemo(() => {
    const withShortage = orders.filter((o) => o.lines.some((l) => l.isShortage))
    if (!opsListFilter) return withShortage
    return withShortage.filter((o) => poMatchesOpsFilter(o, opsListFilter))
  }, [orders, opsListFilter])

  const handleStatClick = (filter: OpsListFilter) => {
    if (opsListFilter === filter) clearOpsListFilter()
    else goToOpsFilteredList(filter)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-ink">履约进度总览</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map(({ filter, label, statKey }) => {
          const active = opsListFilter === filter
          return (
            <button
              key={filter}
              type="button"
              title={active ? '再次点击取消筛选' : '点击按此类别筛选缺货单'}
              onClick={() => handleStatClick(filter)}
              className={`group cursor-pointer rounded-card border px-3 py-2 text-left transition-all duration-200 ${
                active
                  ? 'border-off-black bg-off-black text-paper-canvas shadow-soft'
                  : 'border-pale-stone/20 bg-card hover:border-off-black hover:bg-off-black hover:text-paper-canvas hover:shadow-soft active:scale-[0.98]'
              }`}
            >
              <p
                className={`text-[10px] transition-colors ${
                  active
                    ? 'text-paper-canvas/90'
                    : 'text-muted group-hover:!text-paper-canvas'
                }`}
              >
                {label}
              </p>
              <p
                className={`text-lg font-semibold transition-colors ${
                  active ? 'text-paper-canvas' : 'text-ink group-hover:!text-paper-canvas'
                }`}
              >
                {stats[statKey]}
              </p>
            </button>
          )
        })}
      </div>

      {opsListFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-off-black/20 bg-atmosphere-wash/50 px-3 py-2">
          <p className="text-xs text-ink">
            筛选：<span className="font-semibold">{OPS_LIST_FILTER_LABEL[opsListFilter]}</span>
            <span className="ml-2 text-muted">共 {visibleOrders.length} 张缺货单</span>
          </p>
          <button
            type="button"
            className="text-xs text-off-black underline"
            onClick={clearOpsListFilter}
          >
            清除筛选
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-pale-stone/15">
        <table className="w-full text-left text-xs">
          <thead className="bg-segment-track/80 text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">缺货单号</th>
              <th className="px-3 py-2 font-medium">客户</th>
              <th className="px-3 py-2 font-medium">出货日</th>
              <th className="px-3 py-2 font-medium">缺货</th>
              <th className="px-3 py-2 font-medium">销售</th>
              <th className="px-3 py-2 font-medium">采购</th>
              <th className="px-3 py-2 font-medium">运营</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {visibleOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted">
                  当前筛选下暂无缺货单
                </td>
              </tr>
            )}
            {visibleOrders.map((po) => {
              const shortageLines = po.lines.filter((l) => l.isShortage)
              const linesInFilter = opsListFilter
                ? shortageLines.filter((l) => lineMatchesOpsFilter(l, opsListFilter))
                : shortageLines
              const p = poProgress(po)
              return (
                <tr
                  key={po.id}
                  className="border-t border-pale-stone/10 hover:bg-segment-track/40"
                >
                  <td className="px-3 py-2.5 font-mono">{po.id}</td>
                  <td className="px-3 py-2.5">{po.customerName}</td>
                  <td className="px-3 py-2.5">{po.requiredDeliveryDate}</td>
                  <td className="px-3 py-2.5">
                    {opsListFilter
                      ? `${new Set(linesInFilter.map((l) => l.sku)).size} SKU`
                      : `${countShortageSkus(po.lines)} SKU`}
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {p.salesDone}/{p.total}
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {p.procDone}/{p.total}
                  </td>
                  <td className="px-3 py-2.5">
                    {linesInFilter.some((l) => l.status === 'ready_for_po') ? (
                      <LineStatusBadge status="ready_for_po" />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="text-off-black underline"
                      onClick={() => selectPo(po.id)}
                    >
                      查看
                    </button>
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
