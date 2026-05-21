import { useEffect, useRef, useState } from 'react'
import { VOICE_PO_SAMPLES } from '../../mocks/parsedOrder'
import { useWorkflowStore } from '../../store/workflowStore'
import { useWorkflowActions } from '../../hooks/useWorkflowActions'

type VoiceState = 'ready' | 'recording' | 'parsed'

const CANCEL_SWIPE_PX = 56

function RecordingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 px-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/90"
          style={{
            animation: 'voice-dot 1.1s ease-in-out infinite',
            animationDelay: `${(i % 6) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

export function PurchaseOrderModal() {
  const show = useWorkflowStore((s) => s.showPurchaseModal)
  const setShow = useWorkflowStore((s) => s.setShowPurchaseModal)
  const { handlePurchaseSubmit } = useWorkflowActions()

  const [voiceState, setVoiceState] = useState<VoiceState>('ready')
  const [willCancel, setWillCancel] = useState(false)
  const [sampleIdx, setSampleIdx] = useState(0)
  const [parsed, setParsed] = useState<(typeof VOICE_PO_SAMPLES)[0] | null>(null)

  const holdRef = useRef<HTMLButtonElement>(null)
  const startYRef = useRef(0)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (show) {
      setVoiceState('ready')
      setParsed(null)
      setWillCancel(false)
    }
  }, [show])

  if (!show) return null

  const onHoldPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (voiceState !== 'ready') return
    e.preventDefault()
    cancelledRef.current = false
    setWillCancel(false)
    startYRef.current = e.clientY
    setVoiceState('recording')
    holdRef.current?.setPointerCapture(e.pointerId)
  }

  const onHoldPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (voiceState !== 'recording') return
    const cancel = startYRef.current - e.clientY > CANCEL_SWIPE_PX
    cancelledRef.current = cancel
    setWillCancel(cancel)
  }

  const finishHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (voiceState !== 'recording') return
    holdRef.current?.releasePointerCapture(e.pointerId)
    if (!cancelledRef.current) {
      const sample = VOICE_PO_SAMPLES[sampleIdx % VOICE_PO_SAMPLES.length]
      setSampleIdx((i) => i + 1)
      setParsed(sample)
      setVoiceState('parsed')
    } else {
      setVoiceState('ready')
    }
    setWillCancel(false)
    cancelledRef.current = false
  }

  const onConfirm = () => {
    if (!parsed) return
    handlePurchaseSubmit(parsed.supplier, parsed.amount)
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-card border border-[var(--color-chat-primary-light)] bg-card p-5 shadow-input"
        role="dialog"
        aria-labelledby="po-modal-title"
      >
        <h2 id="po-modal-title" className="text-lg font-semibold text-[var(--color-chat-primary)]">
          采购订单生成
        </h2>
        <p className="mt-1 text-sm text-[var(--color-chat-primary)]/80">
          语音说出供应商与采购金额，Agent 将自动填写
        </p>

        {voiceState === 'parsed' && parsed ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-[var(--color-chat-primary-light)]/40 px-3 py-2.5">
              <p className="text-xs text-[var(--color-chat-primary)]">语音识别</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">「{parsed.transcript}」</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--color-chat-primary-light)]">
              <div className="border-b border-[var(--color-chat-primary-light)] bg-[var(--color-chat-primary-light)]/30 px-3 py-2">
                <p className="text-xs font-medium text-[var(--color-chat-primary)]">已自动填写</p>
              </div>
              <div className="space-y-2 px-3 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted">供应商</span>
                  <span className="font-medium text-ink">{parsed.supplier}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted">采购金额</span>
                  <span className="font-medium text-ink">
                    ¥{parsed.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShow(false)}
                className="flex-1 rounded-card border border-[var(--color-chat-primary-light)] py-3 text-sm font-medium text-[var(--color-chat-primary)]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-card bg-[var(--color-chat-primary)] py-3 text-sm font-medium text-white"
              >
                确认生成
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setParsed(null)
                setVoiceState('ready')
              }}
              className="w-full text-center text-xs text-[var(--color-chat-primary)]"
            >
              重新语音输入
            </button>
          </div>
        ) : (
          <div className="mt-4">
            {voiceState === 'recording' && (
              <p
                className={`mb-2 text-center text-[13px] ${
                  willCancel ? 'text-red-500' : 'text-[var(--color-chat-primary)]/70'
                }`}
              >
                {willCancel ? '松开取消' : '松手完成  上移取消'}
              </p>
            )}
            <button
              ref={holdRef}
              type="button"
              onPointerDown={onHoldPointerDown}
              onPointerMove={onHoldPointerMove}
              onPointerUp={finishHold}
              onPointerCancel={finishHold}
              className={`flex h-12 w-full touch-none select-none items-center justify-center rounded-full shadow-soft transition-colors ${
                voiceState === 'recording'
                  ? willCancel
                    ? 'bg-[var(--color-chat-primary)]/45'
                    : 'bg-[var(--color-chat-primary)]'
                  : 'border border-[var(--color-chat-primary-light)] bg-white text-[15px] font-semibold text-[var(--color-chat-primary)]'
              }`}
            >
              {voiceState === 'recording' ? (
                <RecordingDots />
              ) : (
                '按住说话 填写采购信息'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="mt-3 w-full py-2 text-sm text-muted"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
