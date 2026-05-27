import { useShortageStore } from '../../../store/shortageStore'
import {
  FULFILLMENT_METHOD_LABEL,
  LINE_STATUS_LABEL,
  OA_APPROVAL_STATUS_LABEL,
  SALES_OUTBOUND_LABEL,
} from '../../../constants/shortageLabels'
import type { PipelineStageKey } from '../../../types/shortage'
import {
  isLogisticsFulfillment,
  showsProcurementAdvice,
  showsSalesNote,
  showsSupplierProcurement,
} from '../../../utils/fulfillmentMethodRules'
import { LineStatusBadge } from '../shared/LineStatusBadge'
import { LogisticsSignoffPanel } from '../tasks/LogisticsSignoffPanel'

export function PipelineLineDetailView({
  lineId,
  stageKey,
}: {
  lineId: string
  stageKey: PipelineStageKey
}) {
  const orders = useShortageStore((s) => s.orders)
  const ctx = orders.flatMap((o) => o.lines.map((l) => ({ ...l, po: o }))).find((l) => l.id === lineId)

  if (!ctx) return null

  const method = ctx.fulfillmentMethod
  const logistics = isLogisticsFulfillment(method)
  const showAdvice =
    !logistics && showsProcurementAdvice(method) && !!ctx.opsAdvice.trim() && stageKey !== 'ops_create'
  const showSalesRemark = !logistics && showsSalesNote(method) && !!ctx.salesNote.trim()
  const showSupplier = showsSupplierProcurement(method) && !!ctx.supplierName.trim()

  return (
    <div className="pipeline-line-detail space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <LineStatusBadge status={ctx.status} />
        {method !== 'pending' && (
          <span className="rounded-full bg-brand-muted px-2.5 py-0.5 text-caption font-medium text-brand-dark">
            履约方式：{FULFILLMENT_METHOD_LABEL[method]}
          </span>
        )}
      </div>

      <dl className="pipeline-line-detail__grid">
        <div>
          <dt>客户名称</dt>
          <dd>{ctx.po.customerName}</dd>
        </div>
        <div>
          <dt>客户地址</dt>
          <dd>{ctx.po.deliveryAddress}</dd>
        </div>
        <div>
          <dt>产品名称</dt>
          <dd>
            {ctx.productName} · {ctx.spec}
          </dd>
        </div>
        <div>
          <dt>缺货数量</dt>
          <dd className="font-data text-brand">
            {ctx.gap}
            {ctx.unit}
          </dd>
        </div>
        <div>
          <dt>交货日期</dt>
          <dd className="font-data">{ctx.po.requiredDeliveryDate}</dd>
        </div>
        <div>
          <dt>PO单号</dt>
          <dd className="font-data">{ctx.po.id}</dd>
        </div>
        {ctx.po.specialNote && (
          <div className="pipeline-line-detail__wide">
            <dt>订单备注</dt>
            <dd>{ctx.po.specialNote}</dd>
          </div>
        )}
        {showAdvice && (
          <div className="pipeline-line-detail__wide">
            <dt>采购履约建议</dt>
            <dd>{ctx.opsAdvice}</dd>
          </div>
        )}
        {showSalesRemark && (
          <div className="pipeline-line-detail__wide">
            <dt>销售备注</dt>
            <dd>{ctx.salesNote}</dd>
          </div>
        )}
        {showSupplier && (
          <div className="pipeline-line-detail__wide">
            <dt>供应商</dt>
            <dd>
              {ctx.supplierName}
              {ctx.amount > 0 ? ` · ¥${ctx.amount.toLocaleString()}` : ''}
              {ctx.fulfillmentMethod === 'must_on_time' && ctx.oaApprovalStatus !== 'none' && (
                <span className="mt-1 block font-data text-caption text-muted">
                  {OA_APPROVAL_STATUS_LABEL[ctx.oaApprovalStatus]}
                  {ctx.oaRequestNo ? ` · ${ctx.oaRequestNo}` : ''}
                </span>
              )}
              {ctx.procurementDraftNo && (
                <span className="mt-1 block font-data text-caption text-muted">
                  采购订单草稿 {ctx.procurementDraftNo}
                </span>
              )}
              {ctx.opsPoNumber && (
                <span className="mt-1 block font-data text-caption text-muted">
                  采购订单 {ctx.opsPoNumber}
                </span>
              )}
            </dd>
          </div>
        )}
        {ctx.salesOutboundType && (
          <div className="pipeline-line-detail__wide">
            <dt>出库单</dt>
            <dd className="font-data text-caption">
              {SALES_OUTBOUND_LABEL[ctx.salesOutboundType]} {ctx.salesOutboundNo}
            </dd>
          </div>
        )}
      </dl>

      {stageKey === 'fulfillment_done' && <LogisticsSignoffPanel lineId={lineId} />}

      <p className="text-caption text-muted">
        当前状态：{LINE_STATUS_LABEL[ctx.status]}
      </p>
    </div>
  )
}
