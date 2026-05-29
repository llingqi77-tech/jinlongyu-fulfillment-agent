import type { MobileSupplierOption } from '../../../types/shortage'

const STOCK_LABEL: Record<MobileSupplierOption['hasStock'], string> = {
  yes: '有货',
  no: '无货',
  unknown: '待确认',
}

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`
}

type MobileSupplierOptionsCardProps = {
  suppliers: MobileSupplierOption[]
  onSelect?: (index: number) => void
}

export function MobileSupplierOptionsCard({ suppliers, onSelect }: MobileSupplierOptionsCardProps) {
  if (suppliers.length === 0) return null

  return (
    <div className="mobile-supplier-options-card">
      <p className="mobile-supplier-options-card__title">系统推荐供应商（Top 3）</p>
      <ol className="mobile-supplier-options-card__list">
        {suppliers.map((s) => (
          <li key={s.index} className="mobile-supplier-options-card__item">
            <span className="mobile-supplier-options-card__index">{s.index}</span>
            <span className="mobile-supplier-options-card__body">
              <span className="mobile-supplier-options-card__name">{s.name}</span>
              <span className="mobile-supplier-options-card__meta">
                参考采购额 {formatCurrency(s.suggestedAmount)} · 库存{STOCK_LABEL[s.hasStock]}
              </span>
            </span>
            {onSelect ? (
              <button
                type="button"
                className="mobile-supplier-options-card__pick"
                onClick={() => onSelect(s.index)}
              >
                选用
              </button>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mobile-supplier-options-card__hint">
        若三家均无库存，请输入新的供应商名称和金额。
      </p>
    </div>
  )
}
