import { WELCOME_SUBTITLE_AFTER, WELCOME_SUBTITLE_BEFORE } from '../../constants/welcome'

export function WelcomeSubtitle({ className = '' }: { className?: string }) {
  return (
    <p
      className={`font-body text-[16px] leading-[1.35] tracking-[-0.02em] text-pale-stone ${className}`}
    >
      {WELCOME_SUBTITLE_BEFORE}
      <br />
      {WELCOME_SUBTITLE_AFTER}
    </p>
  )
}
