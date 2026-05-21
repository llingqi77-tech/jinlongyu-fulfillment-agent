type AvatarRole = 'user' | 'agent'

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  )
}

export function ChatAvatar({ role }: { role: AvatarRole }) {
  if (role === 'user') {
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-chat-primary-light)] bg-white text-[var(--color-chat-primary)]"
        aria-hidden
      >
        <UserIcon />
      </div>
    )
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-chat-primary)] text-[10px] font-bold tracking-tight text-white"
      aria-hidden
    >
      AI
    </div>
  )
}
