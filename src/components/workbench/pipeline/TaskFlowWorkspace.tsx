import type { TaskFlowKind } from '../../../types/shortage'
import { MobileTaskFlowWorkspace } from '../mobile/MobileTaskFlowWorkspace'

export function TaskFlowWorkspace({ kind }: { kind: TaskFlowKind }) {
  return <MobileTaskFlowWorkspace kind={kind} />
}
