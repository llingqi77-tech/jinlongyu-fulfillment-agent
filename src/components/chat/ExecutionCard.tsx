import { useEffect, useRef, useState } from 'react'

interface ExecutionCardProps {
  steps?: string[]
  streaming?: boolean
}

export function ExecutionCard({ steps = [], streaming = false }: ExecutionCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [typedLen, setTypedLen] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const lastStep = steps[steps.length - 1] ?? ''
  const prevCount = useRef(steps.length)

  useEffect(() => {
    if (!streaming) {
      setTypedLen(lastStep.length)
      return
    }
    if (steps.length > prevCount.current) {
      setTypedLen(0)
      prevCount.current = steps.length
    }
    if (typedLen < lastStep.length) {
      const t = setTimeout(() => setTypedLen((n) => n + 1), 36)
      return () => clearTimeout(t)
    }
  }, [streaming, steps.length, lastStep, typedLen])

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [steps.length, typedLen])

  return (
    <div className="overflow-hidden rounded-card border border-pale-stone/20 bg-atmosphere-wash/40 shadow-soft">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-chat-primary-light)] text-xs text-[var(--color-chat-primary)]">
            {streaming ? (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-chat-primary)]" />
            ) : (
              '◎'
            )}
          </span>
          <span className="text-sm font-medium text-[var(--color-chat-primary)]">
            执行全景
            {streaming && (
              <span className="ml-1.5 text-xs font-normal text-muted">输出中…</span>
            )}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && steps.length > 0 && (
        <ul ref={listRef} className="border-t border-[var(--color-chat-primary-light)] px-3 py-2">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            const showTyped = streaming && isLast
            const text = showTyped ? lastStep.slice(0, typedLen) : step

            return (
              <li
                key={`${i}-${step.slice(0, 8)}`}
                className={`flex items-start gap-2 py-1.5 text-xs transition-opacity duration-300 ${
                  isLast && streaming
                    ? 'text-[var(--color-chat-primary)]'
                    : 'text-[var(--color-chat-primary)]/75'
                }`}
                style={{ opacity: showTyped && typedLen === 0 ? 0.4 : 1 }}
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    isLast && streaming
                      ? 'animate-pulse bg-[var(--color-chat-primary)]'
                      : 'bg-[var(--color-chat-primary)]'
                  }`}
                />
                <span className="min-w-0 flex-1 leading-relaxed">
                  {text}
                  {showTyped && typedLen < lastStep.length && (
                    <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-[var(--color-chat-primary)] align-middle" />
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
