import type { ShortagePO, ShortagePOLine } from '../types/shortage'
import { daysRemaining } from './shortageAggregations'

const MAX_LEN = 40

/** 采购缺货履约建议：到仓+物流 vs 交期 */
export function generateProcurementAdvice(line: ShortagePOLine, po: ShortagePO): string {
  const days = daysRemaining(po.requiredDeliveryDate)
  const gap = `${line.gap}${line.unit}`
  const leadDays = days <= 2 ? 4 : days <= 5 ? 3 : 2

  let text: string
  if (days <= leadDays) {
    text = `到仓+物流预计晚于交期${gap}，请销售沟通延期或当期加急`
  } else if (line.hasInTransitOrder) {
    text = `有在途订单，可按正常补货节奏；若交期紧建议加急`
  } else {
    text = `按常规物流可在交期内满足${gap}；若客户不接受可沟通延期`
  }

  return text.slice(0, MAX_LEN)
}
