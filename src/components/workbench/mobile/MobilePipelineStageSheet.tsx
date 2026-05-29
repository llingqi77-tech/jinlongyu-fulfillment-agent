import { useEffect, useMemo, useState } from 'react'
import { PIPELINE_STAGE_SHORT } from '../../../constants/shortageLabels'
import { useShortageStore } from '../../../store/shortageStore'
import type { PipelineStageKey, RoleTaskItem } from '../../../types/shortage'
import {
  classifyProcurementSourcingSubstep,
  getProcurementSourcingBreakdown,
  getStagePendingDetailItems,
} from '../../../utils/shortageAggregations'
import { sendMobileAgentMessage, startMobileTaskInChat } from '../../../utils/mobileAgentDialogue'
import {
  buildOpsNotifyMessage,
  getStageViewOnlyNote,
  getTaskLineDetails,
  isRoleOwnedPipelineStage,
  opsStageSupportsNotify,
} from '../../../utils/mobileOpsTaskDetail'

const STAGE_SHEET_TITLE: Record<PipelineStageKey, string> = {
  ops_create: '任务创建',
  ...PIPELINE_STAGE_SHORT,
}

const OPS_STAGE_HINT: Partial<Record<PipelineStageKey, string>> = {
  ops_create: '任务未录入完整属于系统同步问题，无需通知业务角色。',
  fulfillment_done: '履约未完成属于物流环节问题，无需通知业务角色。',
}

const ROLE_LIST_HINT =
  '点击任务查看详细信息与当前进度；属于你负责环节的任务可在对话中继续处理。'

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`
}

export function MobilePipelineStageSheet() {
  const stageKey = useShortageStore((s) => s.mobilePipelineStageKey)
  const close = useShortageStore((s) => s.closeMobilePipelineStageSheet)
  const orders = useShortageStore((s) => s.orders)
  const role = useShortageStore((s) => s.role)
  const isOps = role === 'ops'
  const [selectedTask, setSelectedTask] = useState<RoleTaskItem | null>(null)

  useEffect(() => {
    setSelectedTask(null)
  }, [stageKey])

  const items = useMemo(
    () => (stageKey ? getStagePendingDetailItems(orders, stageKey) : []),
    [orders, stageKey]
  )

  const isRoleActionStage = stageKey ? isRoleOwnedPipelineStage(role, stageKey) : false

  const selectedDetails = useMemo(() => {
    if (!stageKey || !selectedTask) return []
    return getTaskLineDetails(orders, selectedTask, stageKey)
  }, [orders, selectedTask, stageKey])

  const notifyMessage = useMemo(() => {
    if (!stageKey || !isOps || !selectedTask) return null
    return buildOpsNotifyMessage(stageKey, selectedDetails)
  }, [isOps, selectedDetails, selectedTask, stageKey])

  const procurementBreakdown = useMemo(
    () => (stageKey === 'procurement' ? getProcurementSourcingBreakdown(orders) : null),
    [orders, stageKey]
  )

  const procurementGroups = useMemo(() => {
    if (stageKey !== 'procurement') return null
    const supplier: RoleTaskItem[] = []
    const po: RoleTaskItem[] = []
    for (const task of items) {
      const line = orders.flatMap((o) => o.lines).find((l) => l.id === task.lineId)
      if (!line) continue
      const sub = classifyProcurementSourcingSubstep(line)
      if (sub === 'supplier') supplier.push(task)
      else if (sub === 'po') po.push(task)
    }
    return { supplier, po }
  }, [items, orders, stageKey])

  const renderTaskList = (list: RoleTaskItem[], offset = 0) => (
    <ol className="mobile-home-task-list">
      {list.map((task, index) => (
        <li key={task.id}>
          <button
            type="button"
            className="mobile-home-task-list__item"
            onClick={() => pickTask(task)}
          >
            <span className="mobile-home-task-list__index" aria-hidden>
              {offset + index + 1}
            </span>
            <span className="mobile-home-task-list__body">
              <span className="mobile-home-task-list__title">{task.title}</span>
              <span className="mobile-home-task-list__sub">{task.sub}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  )

  if (!stageKey) return null

  const pickTask = (task: RoleTaskItem) => {
    setSelectedTask(task)
  }

  const handleClose = () => {
    setSelectedTask(null)
    close()
  }

  const handleBack = () => setSelectedTask(null)

  const sendNotify = () => {
    if (!notifyMessage) return
    handleClose()
    sendMobileAgentMessage(notifyMessage)
  }

  const handleChatTask = () => {
    if (!selectedTask) return
    handleClose()
    startMobileTaskInChat(selectedTask)
  }

  const title = STAGE_SHEET_TITLE[stageKey]
  const subtitle =
    stageKey === 'ops_create'
      ? `今日 ${items.length} 个待履约任务`
      : stageKey === 'procurement' && procurementBreakdown
        ? [
            ...(procurementBreakdown.supplierPending > 0
              ? [`${procurementBreakdown.supplierPending} 待确定供应商`]
              : []),
            ...(procurementBreakdown.poPending > 0
              ? [`${procurementBreakdown.poPending} 待提交采购订单`]
              : []),
          ].join(' · ') || `${items.length} 项待处理`
        : `${items.length} 项待处理`

  const listHint = isOps
    ? OPS_STAGE_HINT[stageKey] ??
      '点击任务查看酒店、缺货与交期等明细；采购/销售环节将同步生成通知话术。'
    : ROLE_LIST_HINT

  const viewOnlyNote = getStageViewOnlyNote(role, stageKey)

  return (
    <div
      className="mobile-sheet mobile-pipeline-stage-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}待处理任务`}
    >
      <button type="button" className="mobile-sheet__backdrop" onClick={handleClose} aria-label="关闭" />
      <div className="mobile-sheet__panel mobile-sheet__panel--tall">
        <header className="mobile-sheet__header">
          <div className="mobile-pipeline-stage-sheet__heading">
            {selectedTask ? (
              <button type="button" className="mobile-ops-task-detail__back" onClick={handleBack}>
                ← 返回列表
              </button>
            ) : null}
            <h2 className="mobile-sheet__title">
              {selectedTask ? selectedTask.title : title}
            </h2>
            {!selectedTask ? (
              <p className="mobile-pipeline-stage-sheet__subtitle">{subtitle}</p>
            ) : null}
            {!selectedTask && listHint ? (
              <p className="mobile-pipeline-stage-sheet__ops-hint">{listHint}</p>
            ) : null}
          </div>
          <button type="button" className="mobile-sheet__close" onClick={handleClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <div className="mobile-sheet__body mobile-task-list-sheet__list">
          {selectedTask ? (
            <div className="mobile-ops-task-detail">
              <section className="mobile-ops-task-detail__card mobile-ops-task-detail__card--progress">
                <dl className="mobile-ops-task-detail__grid">
                  <div>
                    <dt>当前环节</dt>
                    <dd>{title}</dd>
                  </div>
                  <div className="mobile-ops-task-detail__wide">
                    <dt>当前进度</dt>
                    <dd>{selectedTask.sub}</dd>
                  </div>
                </dl>
              </section>

              {selectedDetails.map((detail) => (
                <section key={detail.lineId} className="mobile-ops-task-detail__card">
                  <dl className="mobile-ops-task-detail__grid">
                    <div>
                      <dt>酒店名称</dt>
                      <dd>{detail.hotelName}</dd>
                    </div>
                    <div>
                      <dt>酒店地址</dt>
                      <dd>{detail.hotelAddress}</dd>
                    </div>
                    <div>
                      <dt>缺货品</dt>
                      <dd>{detail.productName}</dd>
                    </div>
                    <div>
                      <dt>规格</dt>
                      <dd>{detail.spec}</dd>
                    </div>
                    <div>
                      <dt>缺货数量</dt>
                      <dd>
                        {detail.gap}
                        {detail.unit}
                      </dd>
                    </div>
                    <div>
                      <dt>单价</dt>
                      <dd>{formatCurrency(detail.unitPrice)}</dd>
                    </div>
                    <div>
                      <dt>总价</dt>
                      <dd>{formatCurrency(detail.totalAmount)}</dd>
                    </div>
                    <div>
                      <dt>交货日期</dt>
                      <dd>{detail.deliveryDate}</dd>
                    </div>
                    <div className="mobile-ops-task-detail__wide">
                      <dt>备注</dt>
                      <dd>{detail.remark}</dd>
                    </div>
                  </dl>
                </section>
              ))}

              {notifyMessage ? (
                <div className="mobile-ops-notify-box">
                  <p className="mobile-ops-notify-box__label">通知话术</p>
                  <p className="mobile-ops-notify-box__text">{notifyMessage}</p>
                  <button type="button" className="mobile-ops-notify-box__cta" onClick={sendNotify}>
                    发送到对话
                  </button>
                </div>
              ) : null}

              {isRoleActionStage && !isOps ? (
                <button type="button" className="mobile-ops-notify-box__cta" onClick={handleChatTask}>
                  在对话中处理此任务
                </button>
              ) : null}

              {isOps && !opsStageSupportsNotify(stageKey) ? (
                <p className="mobile-ops-task-detail__note">{OPS_STAGE_HINT[stageKey]}</p>
              ) : null}

              {!isOps && viewOnlyNote ? (
                <p className="mobile-ops-task-detail__note">{viewOnlyNote}</p>
              ) : null}
            </div>
          ) : items.length === 0 ? (
            <p className="mobile-task-list-sheet__empty">暂无待处理任务</p>
          ) : stageKey === 'procurement' && procurementGroups ? (
            <div className="mobile-pipeline-stage-sheet__groups">
              {procurementGroups.supplier.length > 0 ? (
                <section className="mobile-pipeline-stage-sheet__group">
                  <h3 className="mobile-pipeline-stage-sheet__group-title">
                    ① 待确定供应商（{procurementGroups.supplier.length}）
                  </h3>
                  {renderTaskList(procurementGroups.supplier)}
                </section>
              ) : null}
              {procurementGroups.po.length > 0 ? (
                <section className="mobile-pipeline-stage-sheet__group">
                  <h3 className="mobile-pipeline-stage-sheet__group-title">
                    ② 待提交采购订单（{procurementGroups.po.length}）
                  </h3>
                  {renderTaskList(procurementGroups.po, procurementGroups.supplier.length)}
                </section>
              ) : null}
            </div>
          ) : (
            <ol className="mobile-home-task-list">
              {items.map((task, index) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="mobile-home-task-list__item"
                    onClick={() => pickTask(task)}
                  >
                    <span className="mobile-home-task-list__index" aria-hidden>
                      {index + 1}
                    </span>
                    <span className="mobile-home-task-list__body">
                      <span className="mobile-home-task-list__title">{task.title}</span>
                      <span className="mobile-home-task-list__sub">{task.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
