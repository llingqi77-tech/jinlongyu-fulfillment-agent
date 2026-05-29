import { useMemo } from 'react'
import { PIPELINE_STAGE_DESC } from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import type { PipelineChevronStage, PipelineStageKey, ShortagePO } from '../../../types/shortage'
import {
  getPipelineBottleneckStageKey,
  getPipelineChevronStages,
  getProcurementSourcingBreakdown,
  STAGE_ACTION_ROLE,
} from '../../../utils/shortageAggregations'
import { ROLE_LABEL } from '../../../utils/mobileAgentSummary'
import { MobileHomeKpiStrip } from './MobileHomeKpiStrip'

const STEP_SHORT_TITLE: Record<PipelineStageKey, string> = {
  ops_create: '任务创建',
  procurement_advice: '采购履约建议',
  sales_method: '销售沟通',
  procurement: '采购寻源',
  fulfillment_done: '履约完成',
}

const STEP_OWNER_HINT: Record<PipelineStageKey, string> = {
  ops_create: '系统录入',
  procurement_advice: '采购负责',
  sales_method: '销售负责',
  procurement: '采购负责',
  fulfillment_done: '物流跟单',
}

function getStagePending(stage: PipelineChevronStage): number {
  return Math.max(0, stage.progressTotal - stage.progressDone)
}

function getStageStatusText(stage: PipelineChevronStage, orders: ShortagePO[]): string {
  if (stage.key === 'ops_create') {
    return `今日 ${stage.row1Value} 个待履约任务`
  }
  const pending = getStagePending(stage)
  if (stage.key === 'procurement' && pending > 0) {
    const { supplierPending, poPending } = getProcurementSourcingBreakdown(orders)
    const segments: string[] = []
    if (supplierPending > 0) segments.push(`${supplierPending} 待确定供应商`)
    if (poPending > 0) segments.push(`${poPending} 待提交采购订单`)
    if (segments.length > 0) return segments.join(' · ')
  }
  if (pending > 0) return `${pending} 待处理`
  return '无积压'
}

function getOpsNotifyRoleLabel(stageKey: PipelineStageKey): string | null {
  const actionRole = STAGE_ACTION_ROLE[stageKey]
  return actionRole ? ROLE_LABEL[actionRole] : null
}

function getStageDesc(stageKey: PipelineStageKey): string {
  if (stageKey === 'ops_create') return '系统同步今日缺货任务'
  if (stageKey === 'fulfillment_done') return '物流签收与任务闭环'
  return PIPELINE_STAGE_DESC[stageKey]
}

export function MobilePipelineProgressBoard() {
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
  const openStageSheet = useShortageStore((s) => s.openMobilePipelineStageSheet)
  const stages = useMemo(() => getPipelineChevronStages(orders), [orders])
  const bottleneckKey = useMemo(() => getPipelineBottleneckStageKey(orders), [orders])
  const isOps = role === 'ops'

  const totalPending = stages.reduce((sum, stage) => {
    if (stage.key === 'ops_create') return sum
    return sum + getStagePending(stage)
  }, 0)

  const summaryText = useMemo(() => {
    if (totalPending <= 0) return '各环节无积压'
    if (isOps && bottleneckKey) {
      const notifyRole = getOpsNotifyRoleLabel(bottleneckKey)
      if (notifyRole) return `共 ${totalPending} 项未处理 · 建议通知${notifyRole}`
    }
    return `共 ${totalPending} 项未处理`
  }, [totalPending, isOps, bottleneckKey])

  return (
    <div
      className={[
        'mobile-welcome-card',
        isOps ? 'mobile-welcome-card--ops-focus' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isOps ? '全链路任务监控' : '当前任务进度概览'}
    >
      <div className="mobile-welcome-card__banner mobile-pipeline-board__banner">
        <span className="mobile-pipeline-board__title">
          {isOps ? '全链路任务监控' : '当前任务进度概览'}
        </span>
        <span className="mobile-pipeline-board__summary">{summaryText}</span>
        <span className="mobile-welcome-card__check" aria-hidden>
          ✓
        </span>
      </div>
      <div className="mobile-welcome-card__body mobile-pipeline-board__body">
        <MobileHomeKpiStrip />
        {isOps ? (
          <p className="mobile-pipeline-board__hint">
            点击下方各环节查看待处理明细，跟进对应角色推进任务。
          </p>
        ) : null}
        <ol className="mobile-pipeline-list">
          {stages.map((stage, index) => {
            const pending = getStagePending(stage)
            const isRoleStep = stage.actionRole === role
            const isBottleneck = bottleneckKey === stage.key
            const isStuck =
              stage.key !== 'ops_create' && pending > 0 && !isBottleneck && !isRoleStep

            return (
              <li key={stage.key}>
                <button
                  type="button"
                  className={[
                    'mobile-pipeline-step',
                    isOps ? 'mobile-pipeline-step--ops' : '',
                    isRoleStep ? 'mobile-pipeline-step--active' : '',
                    isStuck ? 'mobile-pipeline-step--stuck' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => openStageSheet(stage.key)}
                  aria-label={
                    isBottleneck
                      ? `${STEP_SHORT_TITLE[stage.key]}积压较多，点击查看待处理明细`
                      : `点击查看${STEP_SHORT_TITLE[stage.key]}待处理明细`
                  }
                >
                  <span className="mobile-pipeline-step__badge" aria-hidden>
                    {index + 1}
                  </span>
                  <div className="mobile-pipeline-step__body">
                    <div className="mobile-pipeline-step__top">
                      <p className="mobile-pipeline-step__title">
                        {STEP_SHORT_TITLE[stage.key]}
                        {isBottleneck ? (
                          <span className="mobile-pipeline-step__tag" aria-hidden>
                            ⚠
                          </span>
                        ) : null}
                      </p>
                      <span
                        className={[
                          'mobile-pipeline-step__ratio',
                          pending > 0 && stage.key !== 'ops_create'
                            ? 'mobile-pipeline-step__ratio--pending'
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {getStageStatusText(stage, orders)}
                      </span>
                    </div>
                    {isOps ? (
                      <p className="mobile-pipeline-step__meta">
                        <span className="mobile-pipeline-step__owner">{STEP_OWNER_HINT[stage.key]}</span>
                        <span className="mobile-pipeline-step__desc">{getStageDesc(stage.key)}</span>
                      </p>
                    ) : null}
                    <div className="mobile-pipeline-step__track" aria-hidden>
                      <div
                        className="mobile-pipeline-step__track-done"
                        style={{ width: `${stage.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  {isOps ? (
                    <span className="mobile-pipeline-step__chevron" aria-hidden>
                      ›
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
