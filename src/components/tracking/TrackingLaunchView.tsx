import { useWorkflowStore } from '../../store/workflowStore'
import type { TrackingSystem } from '../../types/workflow'

const BRAND: Record<
  TrackingSystem,
  { name: string; sub: string; launchBg: string; accent: string }
> = {
  order: {
    name: '金龙鱼 OMS',
    sub: '订单管理系统',
    launchBg: 'var(--gradient-sky-mint)',
    accent: 'var(--color-off-black)',
  },
  inventory: {
    name: '金龙鱼 WMS',
    sub: '库存管理系统',
    launchBg: 'var(--gradient-sunset-violet)',
    accent: 'var(--color-off-black)',
  },
  purchase: {
    name: '金龙鱼 SRM',
    sub: '采购管理系统',
    launchBg: 'var(--gradient-amber-glow)',
    accent: 'var(--color-off-black)',
  },
}

export function TrackingLaunchView({ system }: { system: TrackingSystem }) {
  const brand = BRAND[system]

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-ink"
      style={{ background: brand.launchBg }}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-card border border-off-black/20 bg-paper-canvas/80 text-2xl font-medium backdrop-blur-sm">
        金
      </div>
      <p className="font-display text-lg tracking-[-0.02em]">{brand.name}</p>
      <p className="mt-1 text-sm text-pale-stone">{brand.sub}</p>
      <div className="mt-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-off-black/70"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-faint-text">正在启动…</p>
    </div>
  )
}

export function TrackingLoginView({ system }: { system: TrackingSystem }) {
  const screen = useWorkflowStore((s) => s.trackingScreen)
  const brand = BRAND[system]
  const progress = screen.loginProgress ?? 0

  return (
    <div className="flex min-h-full flex-col bg-paper-canvas p-4">
      <div className="mx-auto mt-6 w-full max-w-[240px] rounded-card border border-pale-stone/20 bg-atmosphere-wash/30 p-5 shadow-soft">
        <div
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium text-paper-canvas"
          style={{ backgroundColor: brand.accent }}
        >
          金
        </div>
        <p className="text-sm font-medium text-ink">账号登录</p>
        <p className="mt-0.5 text-[11px] text-muted">{brand.sub}</p>
        <div className="mt-4 space-y-2">
          <div className="rounded-lg border border-pale-stone/30 bg-paper-canvas px-3 py-2 text-xs text-muted">
            agent.ops@wilmar.cn
          </div>
          <div className="rounded-lg border border-pale-stone/30 bg-paper-canvas px-3 py-2 text-xs tracking-widest text-muted">
            ••••••••
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-pale-stone/20">
          <div
            className="h-full rounded-full bg-off-black transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-[10px] text-muted">{screen.statusText}</p>
      </div>
    </div>
  )
}
