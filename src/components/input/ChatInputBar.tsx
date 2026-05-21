import { useEffect, useRef, useState } from 'react'
import { ScrollToBottomButton } from '../chat/ScrollToBottomButton'
import { EMAIL_PARSE_TODAY_PROMPT } from '../../utils/emailSystem'
import { useWorkflowStore } from '../../store/workflowStore'
import { useWorkflowActions } from '../../hooks/useWorkflowActions'

type VoicePanelState = 'off' | 'ready' | 'recording'

const CANCEL_SWIPE_PX = 56

function PaperclipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3z" />
      <path d="M19 11a7 7 0 01-14 0M12 18v3" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="1.6"
    >
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M7 9h.01M11 9h.01M15 9h.01M7 12h.01M11 12h.01M15 12h.01M9 15h6" strokeLinecap="round" />
    </svg>
  )
}

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

function actionCircleClass(emphasized: boolean) {
  return [
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-soft active:opacity-80',
    emphasized ? 'bg-[#1E5BB8]' : 'bg-[#1E5BB8]/35',
  ].join(' ')
}

function EmailSystemSwitch({
  enabled,
  canToggle,
  busy,
  onChange,
}: {
  enabled: boolean
  canToggle: boolean
  busy: boolean
  onChange: (enabled: boolean) => void
}) {
  const [showLockHint, setShowLockHint] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissHint = () => {
    setShowLockHint(false)
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current)
      hintTimerRef.current = null
    }
  }

  const showHintPopover = () => {
    setShowLockHint(true)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(dismissHint, 2600)
  }

  useEffect(() => {
    if (!showLockHint) return
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        dismissHint()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showLockHint])

  useEffect(() => () => dismissHint(), [])

  const handleClick = () => {
    if (busy) return
    if (!canToggle) {
      showHintPopover()
      return
    }
    dismissHint()
    onChange(!enabled)
  }

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1.5">
      <span className="text-[12px] font-medium text-[#1E5BB8]">邮件系统</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? '邮件系统已开启' : '开启邮件系统'}
        disabled={busy}
        onClick={handleClick}
        className={[
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
          enabled ? 'bg-[#1E5BB8]' : 'bg-[#E9E9EB]',
          busy
            ? 'cursor-not-allowed opacity-70'
            : !canToggle
              ? 'cursor-pointer opacity-70'
              : 'active:opacity-90',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform duration-200',
            enabled ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      {showLockHint && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--color-chat-primary-light)] bg-card px-3 py-2 text-[11px] font-medium text-ink shadow-input"
        >
          请开启新对话
        </div>
      )}
    </div>
  )
}

export function ChatInputBar() {
  const [text, setText] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [voicePanel, setVoicePanel] = useState<VoicePanelState>('off')
  const [willCancel, setWillCancel] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const holdRef = useRef<HTMLButtonElement>(null)
  const startYRef = useRef(0)
  const cancelledRef = useRef(false)
  const phase = useWorkflowStore((s) => s.phase)
  const isAgentRunning = useWorkflowStore((s) => s.isAgentRunning)
  const emailSystemEnabled = useWorkflowStore((s) => s.emailSystemEnabled)
  const emailSystemLocked = useWorkflowStore((s) => s.emailSystemLocked)
  const setEmailSystemEnabled = useWorkflowStore((s) => s.setEmailSystemEnabled)
  const { handleFileUpload, handleSendMessage, handleVoiceEdit, handleStopAgent } =
    useWorkflowActions()

  const hasText = text.trim().length > 0
  const showVoiceButton = !hasText && !isAgentRunning
  const isVoiceMode = showVoiceButton && voicePanel === 'off'
  const canVoiceEdit = phase === 'pendingReview'

  const onSend = () => {
    if (!text.trim() || isAgentRunning) return
    handleSendMessage(text)
    setText('')
  }

  const onFileChange = (file: File | undefined) => {
    if (file && !isAgentRunning) {
      handleFileUpload(file)
      setShowAttachMenu(false)
    }
  }

  const onToggleEmailSystem = (next: boolean) => {
    if (isAgentRunning || emailSystemLocked || phase !== 'idle') return
    setEmailSystemEnabled(next)
    if (next) {
      setText(EMAIL_PARSE_TODAY_PROMPT)
      setVoicePanel('off')
    } else if (text === EMAIL_PARSE_TODAY_PROMPT) {
      setText('')
    }
  }

  useEffect(() => {
    if (isAgentRunning) setVoicePanel('off')
  }, [isAgentRunning])

  useEffect(() => {
    if (hasText) setVoicePanel('off')
  }, [hasText])

  useEffect(() => {
    if (!showAttachMenu) return
    const onPointerDown = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showAttachMenu])

  const onHoldPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (voicePanel !== 'ready') return
    e.preventDefault()
    cancelledRef.current = false
    setWillCancel(false)
    startYRef.current = e.clientY
    setVoicePanel('recording')
    holdRef.current?.setPointerCapture(e.pointerId)
  }

  const onHoldPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (voicePanel !== 'recording') return
    const cancel = startYRef.current - e.clientY > CANCEL_SWIPE_PX
    cancelledRef.current = cancel
    setWillCancel(cancel)
  }

  const finishHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (voicePanel !== 'recording') return
    holdRef.current?.releasePointerCapture(e.pointerId)
    if (!cancelledRef.current) {
      if (canVoiceEdit) {
        handleVoiceEdit()
      } else {
        handleSendMessage('[语音] 请帮我处理这份订单')
      }
      setVoicePanel('off')
    } else {
      setVoicePanel('ready')
    }
    setWillCancel(false)
    cancelledRef.current = false
  }

  if (voicePanel !== 'off' && !isAgentRunning) {
    return (
      <footer
        className="shrink-0 px-3 pb-[max(8px,var(--safe-bottom))] pt-1"
        style={{ paddingBottom: 'max(8px, var(--safe-bottom))' }}
      >
        {voicePanel === 'recording' && (
          <p
            className={`mb-2 text-center text-[13px] transition-colors ${
              willCancel
                ? 'text-red-500'
                : 'text-[var(--color-chat-primary)]/70'
            }`}
          >
            {willCancel ? '松开取消' : '松手输入  上移取消'}
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            ref={holdRef}
            type="button"
            onPointerDown={onHoldPointerDown}
            onPointerMove={onHoldPointerMove}
            onPointerUp={finishHold}
            onPointerCancel={finishHold}
            className={`flex h-12 min-w-0 flex-1 touch-none select-none items-center justify-center rounded-full shadow-soft transition-colors ${
              voicePanel === 'recording'
                ? willCancel
                  ? 'bg-[var(--color-chat-primary)]/45'
                  : 'bg-[var(--color-chat-primary)]'
                : 'border border-[var(--color-chat-primary-light)] bg-white text-[15px] font-semibold text-[var(--color-chat-primary)] active:bg-[var(--color-chat-primary-light)]/30'
            }`}
          >
            {voicePanel === 'recording' ? <RecordingDots /> : '按住说话 输入任务'}
          </button>
          {voicePanel === 'ready' && (
            <button
              type="button"
              onClick={() => setVoicePanel('off')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-chat-primary)] text-white shadow-soft active:opacity-80"
              aria-label="切换键盘输入"
            >
              <KeyboardIcon />
            </button>
          )}
        </div>
      </footer>
    )
  }

  return (
    <footer
      className="shrink-0 px-3 pb-[max(8px,var(--safe-bottom))] pt-1"
      style={{ paddingBottom: 'max(8px, var(--safe-bottom))' }}
    >
      <ScrollToBottomButton />
      <div className="rounded-pill border border-[var(--color-chat-primary-light)] bg-card px-4 py-3 shadow-input">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isAgentRunning) {
              e.preventDefault()
              onSend()
            }
          }}
          disabled={isAgentRunning}
          rows={1}
          placeholder={
            isAgentRunning
              ? 'Agent 执行中…'
              : phase === 'pendingReview'
                ? '修改订单信息，或语音输入'
                : emailSystemEnabled && phase === 'idle'
                  ? `可输入：${EMAIL_PARSE_TODAY_PROMPT}`
                  : '输入订单要求，或使用语音 / 上传图片'
          }
          className="w-full resize-none border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between">
          <EmailSystemSwitch
            enabled={emailSystemEnabled}
            canToggle={!emailSystemLocked && phase === 'idle'}
            busy={isAgentRunning}
            onChange={onToggleEmailSystem}
          />

          <div ref={attachMenuRef} className="relative flex items-center gap-1">
            <button
              type="button"
              disabled={isAgentRunning}
              onClick={() => setShowAttachMenu((v) => !v)}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--color-chat-primary)] active:opacity-70 disabled:opacity-40"
              aria-label="添加附件"
              aria-expanded={showAttachMenu}
            >
              <PaperclipIcon />
            </button>

            {showAttachMenu && !isAgentRunning && (
              <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[200px] overflow-hidden rounded-xl border border-[var(--color-chat-primary-light)] bg-card py-1 shadow-input">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-ink transition-colors hover:bg-[var(--color-chat-primary-light)]/50"
                >
                  <PaperclipIcon />
                  <span>添加文件</span>
                </button>
                <div className="mx-3 border-t border-border" />
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-ink transition-colors hover:bg-[var(--color-chat-primary-light)]/50"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>上传照片</span>
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => {
                onFileChange(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onFileChange(e.target.files?.[0])
                e.target.value = ''
              }}
            />

            {isAgentRunning ? (
              <button
                type="button"
                onClick={handleStopAgent}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8E8E93] text-white shadow-soft active:opacity-90"
                aria-label="停止"
              >
                <StopIcon />
              </button>
            ) : (
              <button
                type="button"
                disabled={!showVoiceButton && !hasText}
                onClick={isVoiceMode ? () => setVoicePanel('ready') : onSend}
                className={
                  isVoiceMode
                    ? 'flex h-10 w-10 shrink-0 items-center justify-center text-[var(--color-chat-primary)] active:opacity-70 disabled:opacity-40'
                    : actionCircleClass(hasText)
                }
                aria-label={isVoiceMode ? '语音输入' : '发送'}
              >
                {showVoiceButton ? <MicIcon /> : <SendIcon />}
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
