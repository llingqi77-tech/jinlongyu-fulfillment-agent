import { FulfillmentPipeline } from './pipeline/FulfillmentPipeline'

export function WorkbenchContent() {
  return (
    <div className="mx-auto max-w-page workbench-content--pipeline-only">
      <FulfillmentPipeline />
    </div>
  )
}
