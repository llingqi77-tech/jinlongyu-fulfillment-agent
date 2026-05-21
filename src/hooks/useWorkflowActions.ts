import { useCallback } from 'react'
import { VOICE_EDIT_SAMPLES } from '../mocks/parsedOrder'
import { useWorkflowStore } from '../store/workflowStore'
import { isEmailParseTodayCommand } from '../utils/emailSystem'
import { useSimulatedAgent } from './useSimulatedAgent'

export function useWorkflowActions() {
  const uploadAndParse = useWorkflowStore((s) => s.uploadAndParse)
  const confirmToSalesOrder = useWorkflowStore((s) => s.confirmToSalesOrder)
  const submitPurchaseOrder = useWorkflowStore((s) => s.submitPurchaseOrder)
  const openPurchaseModal = useWorkflowStore((s) => s.openPurchaseModal)
  const phase = useWorkflowStore((s) => s.phase)
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)

  const {
    runParsing,
    runEmailParsing,
    runSalesConversion,
    runPurchaseCreation,
    runOrderEdit,
    abortAgent,
  } = useSimulatedAgent()

  const handleFileUpload = useCallback(
    (file: File) => {
      if (isAgentRunning) return
      useWorkflowStore.getState().lockEmailSystem()
      uploadAndParse(file.name)
      void runParsing()
    },
    [uploadAndParse, runParsing, isAgentRunning]
  )

  const handleConfirmSales = useCallback(() => {
    if (phase !== 'pendingReview' || isAgentRunning) return
    confirmToSalesOrder()
    void runSalesConversion()
  }, [phase, isAgentRunning, confirmToSalesOrder, runSalesConversion])

  const handlePurchaseSubmit = useCallback(
    (supplier: string, amount: number) => {
      submitPurchaseOrder(supplier, amount)
      void runPurchaseCreation(supplier, amount)
    },
    [submitPurchaseOrder, runPurchaseCreation]
  )

  const handleSendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isAgentRunning) return

      const store = useWorkflowStore.getState()
      store.lockEmailSystem()
      const currentPhase = store.phase

      if (currentPhase === 'pendingReview') {
        store.pushMessage({ kind: 'user', content: trimmed })
        store.commitUserEdit(trimmed)
        void runOrderEdit(() => {
          store.setAgentRunning(false)
        })
        return
      }

      if (currentPhase === 'idle') {
        store.pushMessage({ kind: 'user', content: trimmed })

        if (store.emailSystemEnabled && isEmailParseTodayCommand(trimmed)) {
          store.parseTodayFromEmail()
          void runEmailParsing()
          return
        }

        const detail = trimmed.startsWith('[语音]')
          ? '正在处理语音订单要求'
          : `正在处理订单要求：${trimmed.length > 28 ? `${trimmed.slice(0, 28)}…` : trimmed}`
        store.parseFromInstruction(detail)
        void runParsing()
        return
      }

      if (currentPhase === 'completed') {
        store.pushMessage({ kind: 'user', content: trimmed })
        store.pushMessage({
          kind: 'system',
          content: '当前流程已完成。如需处理新订单，请点击右上角 + 开启新对话。',
        })
        return
      }

      store.pushMessage({ kind: 'user', content: trimmed })
    },
    [runOrderEdit, runEmailParsing, isAgentRunning]
  )

  const handleVoiceEdit = useCallback(() => {
    if (isAgentRunning || phase !== 'pendingReview') return
    const store = useWorkflowStore.getState()
    store.lockEmailSystem()
    const idx = store.voiceSampleIndex
    const text = `[语音] ${VOICE_EDIT_SAMPLES[idx % VOICE_EDIT_SAMPLES.length]}`
    useWorkflowStore.setState({ voiceSampleIndex: idx + 1 })
    store.pushMessage({ kind: 'user', content: text })
    store.commitUserEdit(text)
    void runOrderEdit(() => {
      store.setAgentRunning(false)
    })
  }, [runOrderEdit, isAgentRunning, phase])

  const handleStopAgent = useCallback(() => {
    abortAgent()
  }, [abortAgent])

  return {
    handleFileUpload,
    handleConfirmSales,
    handlePurchaseSubmit,
    handleSendMessage,
    handleVoiceEdit,
    handleStopAgent,
    openPurchaseModal,
  }
}
