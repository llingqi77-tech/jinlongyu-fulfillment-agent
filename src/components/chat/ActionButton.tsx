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
      className={`w-full ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
    >
      {label}
    </button>
  )
}
