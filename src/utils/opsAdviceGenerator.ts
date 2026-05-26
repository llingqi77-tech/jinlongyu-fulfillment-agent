import type { ShortagePO, ShortagePOLine } from '../types/shortage'
import { daysRemaining } from './shortageAggregations'

const MAX_LEN = 20

/** 运营履约建议（≤20 字，供单行录入） */
export function generateOpsAdvice(line: ShortagePOLine, po: ShortagePO): string {
  const days = daysRemaining(po.requiredDeliveryDate)
  const gap = `${line.gap}${line.unit}`

  let text: string
  if (days <= 2) {
    text = `档期紧，缺${gap}，建议加急寻源`
  } else if (days <= 5) {
    text = `尽快协调，缺${gap}优先调拨`
  } else if (line.availableStock > 0) {
    text = `缺${gap}，可先同仓调拨`
  } else {
    text = `缺${gap}，走正常补货流程`
  }

  return text.slice(0, MAX_LEN)
}
