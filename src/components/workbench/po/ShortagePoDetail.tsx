import { OPS_LIST_FILTER_LABEL } from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import { lineMatchesOpsFilter } from '../../../utils/shortageAggregations'
import { ShortageLineTable } from '../shared/ShortageLineTable'
import { SalesIntentForm } from '../sales/SalesIntentForm'

export function ShortagePoDetail({ poId }: { poId: string }) {
  const po = useShortageStore((s) => s.orders.find((o) => o.id === poId))
  const opsListFilter = useShortageStore((s) => s.opsListFilter)
  const nav = useShortageStore((s) => s.nav)
  const selectPo = useShortageStore((s) => s.selectPo)
  const role = useShortageStore((s) => s.role)
  const openGeneratePo = useShortageStore((s) => s.openGeneratePo)

  if (!po) return <p className="text-sm text-muted">订单不存在</p>

  const shortageLines = po.lines.filter((l) => l.isShortage)
  const filteredShortageLines = opsListFilter
    ? shortageLines.filter((l) => lineMatchesOpsFilter(l, opsListFilter))
    : shortageLines
  const readyLines = filteredShortageLines.filter((l) => l.status === 'ready_for_po')
  const nonShortage = po.lines.filter((l) => !l.isShortage)

  return (
    <div className="space-y-4">
      {nav === 'home' && (
        <button
          type="button"
          className="text-xs text-muted hover:text-ink"
          onClick={() => selectPo(null)}
        >
          ← 返回列表
        </button>
      )}

      <div className="rounded-card border border-pale-stone/15 bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-ink">{po.id}</h2>
            <p className="mt-1 text-sm text-ink">{po.customerName}</p>
          </div>
          {role === 'ops' && readyLines.length > 0 && (
            <button
              type="button"
              className="btn-primary text-xs"
              onClick={() => openGeneratePo(po.id)}
            >
              生成采购订单
            </button>
          )}
        </div>
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted">送货地址</dt>
            <dd className="text-ink">{po.deliveryAddress}</dd>
          </div>
          <div>
            <dt className="text-muted">下单部门</dt>
            <dd className="text-ink">{po.orderDepartment}</dd>
          </div>
          <div>
            <dt className="text-muted">要求送达日</dt>
            <dd className="font-medium text-ink">{po.requiredDeliveryDate}</dd>
          </div>
          {po.specialNote && (
            <div className="sm:col-span-2">
              <dt className="text-muted">特别提示</dt>
              <dd className="rounded-lg bg-atmosphere-wash/60 px-2 py-1 text-ink">{po.specialNote}</dd>
            </div>
          )}
        </dl>
      </div>

      {role === 'sales' && (
        <SalesIntentForm poId={po.id} />
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">
          缺货行项目
          {opsListFilter && (
            <span className="ml-2 text-xs font-normal text-muted">
              （{OPS_LIST_FILTER_LABEL[opsListFilter]}）
            </span>
          )}
        </h3>
        <ShortageLineTable po={po} lines={filteredShortageLines} />
      </div>

      {nonShortage.length > 0 && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">非缺货行 ({nonShortage.length})</summary>
          <ul className="mt-2 space-y-1 pl-4">
            {nonShortage.map((l) => (
              <li key={l.id}>
                {l.productName} · {l.quantity}
                {l.unit}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
