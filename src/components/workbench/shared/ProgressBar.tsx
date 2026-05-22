export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-segment-track ${className}`}>
      <div
        className="h-full rounded-full bg-off-black transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
