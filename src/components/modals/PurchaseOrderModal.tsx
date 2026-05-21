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
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-ink/25 p-4">
      <div
        className="w-full max-w-md rounded-card border border-pale-stone/20 bg-paper-canvas p-5 shadow-input"
        role="dialog"
        aria-labelledby="po-modal-title"
      >
        <h2 id="po-modal-title" className="font-display text-lg font-normal tracking-[-0.02em] text-ink">
          采购订单生成
        </h2>
        <p className="mt-1 text-sm text-pale-stone">
          语音说出供应商与采购金额，Agent 将自动填写
        </p>

        {voiceState === 'parsed' && parsed ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-atmosphere-wash/50 px-3 py-2.5">
              <p className="text-xs text-muted">语音识别</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">「{parsed.transcript}」</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-pale-stone/20">
              <div className="border-b border-pale-stone/20 bg-atmosphere-wash/40 px-3 py-2">
                <p className="text-xs font-medium text-ink">已自动填写</p>
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
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-primary flex-1"
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
              className="w-full text-center text-xs font-medium text-off-black underline decoration-off-black/40 underline-offset-2"
            >
              重新语音输入
            </button>
          </div>
        ) : (
          <div className="mt-4">
            {voiceState === 'recording' && (
              <p
                className={`mb-2 text-center text-[13px] ${
                  willCancel ? 'text-pale-stone' : 'text-faint-text'
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
                    ? 'bg-off-black/45'
                    : 'bg-off-black'
                  : 'btn-secondary-pill text-[15px] font-medium'
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
              className="btn-secondary mt-3 w-full"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
