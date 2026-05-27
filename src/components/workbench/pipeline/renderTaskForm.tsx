import type { PipelineStageKey } from '../../../types/shortage'
import { ProcurementAdviceTask } from '../tasks/ProcurementAdviceTask'
import { SalesFulfillmentForm } from '../tasks/SalesFulfillmentForm'
import { ProcurementSkuTask } from '../tasks/ProcurementSkuTask'

export function renderTaskForm(stageKey: PipelineStageKey, lineId: string) {
  switch (stageKey) {
    case 'procurement_advice':
      return <ProcurementAdviceTask lineId={lineId} />
    case 'sales_method':
      return <SalesFulfillmentForm lineId={lineId} />
    case 'procurement':
      return <ProcurementSkuTask lineId={lineId} />
    default:
      return null
  }
}
