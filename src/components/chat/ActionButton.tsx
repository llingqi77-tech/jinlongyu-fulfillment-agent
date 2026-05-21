interface ActionButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function ActionButton({
  label,
  onClick,
  variant = 'primary',
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-card px-4 py-3 text-sm font-medium transition-opacity active:opacity-80 ${
        variant === 'primary'
          ? 'bg-[var(--color-chat-primary)] text-white shadow-soft'
          : 'border border-[var(--color-chat-primary-light)] bg-card text-[var(--color-chat-primary)]'
      }`}
    >
      {label}
    </button>
  )
}
