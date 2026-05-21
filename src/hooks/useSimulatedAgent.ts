import { useCallback, useRef } from 'react'
import { isAgentAborted, requestAgentAbort, resetAgentAbort } from '../store/agentAbort'
import { runScreenAction } from '../store/trackingScreen'
import {
  completeEmailParsing,
  completeInventoryMatch,
  completeParsing,
  completePurchaseOrder,
  completeSalesConversion,
  EMAIL_PARSING_STEPS,
  INVENTORY_STEPS,
  ORDER_EDIT_STEPS,
  PARSING_STEPS,
  PO_STEPS,
  SALES_STEPS,
  useWorkflowStore,
} from '../store/workflowStore'
import type { AgentStep } from '../types/workflow'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useSimulatedAgent() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    useWorkflowStore.getState().resetAgentElapsed()
    timerRef.current = setInterval(() => {
      useWorkflowStore.getState().tickAgentElapsed()
    }, 1000)
  }, [stopTimer])

  const abortAgent = useCallback(() => {
    requestAgentAbort()
    stopTimer()
    const store = useWorkflowStore.getState()
    store.setAgentRunning(false)
    store.setActiveTab('chat')
    store.setTrackingScreen({
      ...store.trackingScreen,
      statusText: '任务已中止',
    })
    store.pushMessage({
      kind: 'system',
      content: '任务中止',
    })
  }, [stopTimer])

  const runAgentTask = useCallback(
    async (steps: AgentStep[], onComplete: () => void, options?: { switchToTracking?: boolean }) => {
      resetAgentAbort()
      const store = useWorkflowStore.getState()
      store.initAgentRunSteps(steps)
      store.setAgentRunning(true)
      if (options?.switchToTracking !== false) {
        store.setActiveTab('tracking')
      }
      store.setTrackingScreen({
        ...store.trackingScreen,
        statusText: 'Agent 正在操作系统…',
      })
      startTimer()
      store.startExecutionStream()

      for (let i = 0; i < steps.length; i++) {
        if (isAgentAborted()) break
        const step = steps[i]
        const stepId = `run-${i}`
        store.setAgentRunStepStatus(stepId, 'running')
        store.setSystemOp(step.label, step.detail)
        if (step.screenAction) {
          await runScreenAction(step.screenAction, step.durationMs, step.system)
        } else {
          if (step.system) store.setTrackingSystem(step.system)
          await delay(step.durationMs)
        }
        if (isAgentAborted()) break
        store.setAgentRunStepStatus(stepId, 'done')
        store.appendExecutionStep(step.detail)
      }

      stopTimer()
      store.finishExecutionStream()
      if (isAgentAborted()) {
        store.setAgentRunning(false)
        return
      }
      onComplete()
    },
    [startTimer, stopTimer]
  )

  const runParsing = useCallback(async () => {
    await runAgentTask(PARSING_STEPS, completeParsing)
  }, [runAgentTask])

  const runEmailParsing = useCallback(async () => {
    await runAgentTask(EMAIL_PARSING_STEPS, completeEmailParsing)
  }, [runAgentTask])

  const runSalesConversion = useCallback(async () => {
    await runAgentTask(SALES_STEPS, completeSalesConversion)
    if (isAgentAborted()) return
    await runAgentTask(INVENTORY_STEPS, completeInventoryMatch)
  }, [runAgentTask])

  const runPurchaseCreation = useCallback(
    async (supplier: string, amount: number) => {
      await runAgentTask(PO_STEPS, () => completePurchaseOrder(supplier, amount))
    },
    [runAgentTask]
  )

  const runOrderEdit = useCallback(
    async (onComplete: () => void) => {
      await runAgentTask(ORDER_EDIT_STEPS, onComplete, { switchToTracking: true })
    },
    [runAgentTask]
  )

  return {
    runParsing,
    runEmailParsing,
    runSalesConversion,
    runPurchaseCreation,
    runOrderEdit,
    abortAgent,
    stopTimer,
  }
}
