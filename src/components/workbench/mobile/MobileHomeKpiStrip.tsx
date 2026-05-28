import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useShortageStore } from '../../../store/shortageStore'
import type { MobileKpiDimension } from '../../../types/shortage'
import {
  getMobileHomeKpis,
  getMobileKpiShortageLabel,
  MOBILE_KPI_DIMENSION_LABEL,
  MOBILE_KPI_DIMENSION_OPTIONS,
} from '../../../utils/mobileAgentSummary'

export function MobileHomeKpiStrip() {
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
  const [dimension, setDimension] = useState<MobileKpiDimension>('sku')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const kpis = useMemo(
    () => getMobileHomeKpis(orders, role, dimension),
    [orders, role, dimension]
  )

  const dimLabel = MOBILE_KPI_DIMENSION_LABEL[dimension]
  const shortageLabel = getMobileKpiShortageLabel(dimension)

  useEffect(() => {
    if (!filterOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [filterOpen])

  return (
    <div className="mobile-kpi-panel" role="group" aria-label="今日数据概览">
      <div className="mobile-kpi-panel__head">
        <p className="mobile-kpi-panel__scope">统计范围：今日交期缺货</p>
        <div className="mobile-kpi-panel__filter" ref={filterRef}>
          <button
            type="button"
            className="mobile-kpi-panel__filter-btn"
            aria-expanded={filterOpen}
            aria-haspopup="listbox"
            aria-controls={menuId}
            onClick={() => setFilterOpen((v) => !v)}
          >
            按{dimLabel}
            <span className="mobile-kpi-panel__filter-caret" aria-hidden>
              ▾
            </span>
          </button>
          {filterOpen ? (
            <ul id={menuId} className="mobile-kpi-panel__filter-menu" role="listbox">
              {MOBILE_KPI_DIMENSION_OPTIONS.map((d) => (
                <li key={d} role="option" aria-selected={d === dimension}>
                  <button
                    type="button"
                    className={
                      d === dimension
                        ? 'mobile-kpi-panel__filter-option mobile-kpi-panel__filter-option--active'
                        : 'mobile-kpi-panel__filter-option'
                    }
                    onClick={() => {
                      setDimension(d)
                      setFilterOpen(false)
                    }}
                  >
                    {MOBILE_KPI_DIMENSION_LABEL[d]}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mobile-kpi-strip">
        <div className="mobile-kpi-strip__item">
          <span className="mobile-kpi-strip__value">{kpis.fulfilledCount}</span>
          <span className="mobile-kpi-strip__label">已履约</span>
          <span className="mobile-kpi-strip__dim">按{dimLabel}</span>
        </div>
        <div className="mobile-kpi-strip__item mobile-kpi-strip__item--accent">
          <span className="mobile-kpi-strip__value">{kpis.pendingTaskCount}</span>
          <span className="mobile-kpi-strip__label">待完成</span>
          <span className="mobile-kpi-strip__dim">按{dimLabel}</span>
        </div>
        <div className="mobile-kpi-strip__item">
          <span className="mobile-kpi-strip__value">{kpis.shortageLineCount}</span>
          <span className="mobile-kpi-strip__label">{shortageLabel}</span>
          <span className="mobile-kpi-strip__dim">按{dimLabel}</span>
        </div>
      </div>
    </div>
  )
}
