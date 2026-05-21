import { WELCOME_SUBTITLE_AFTER, WELCOME_SUBTITLE_BEFORE } from '../../constants/welcome'

export function WelcomeSubtitle({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-[16px] leading-relaxed text-[var(--color-chat-primary)] ${className}`}
    >
      {WELCOME_SUBTITLE_BEFORE}
      <br />
      {WELCOME_SUBTITLE_AFTER}
    </p>
  )
}
