import { useWorkflowStore } from '../../store/workflowStore'
import type { TrackingSystem } from '../../types/workflow'

const BRAND: Record<
  TrackingSystem,
  { name: string; sub: string; gradient: string; accent: string }
> = {
  order: {
    name: '金龙鱼 OMS',
    sub: '订单管理系统',
    gradient: 'from-[#1E5BB8] to-[#3B82F6]',
    accent: '#1E5BB8',
  },
  inventory: {
    name: '金龙鱼 WMS',
    sub: '库存管理系统',
    gradient: 'from-[#2D6A4F] to-[#40916C]',
    accent: '#2D6A4F',
  },
  purchase: {
    name: '金龙鱼 SRM',
    sub: '采购管理系统',
    gradient: 'from-[#B45309] to-[#D97706]',
    accent: '#B45309',
  },
}

export function TrackingLaunchView({ system }: { system: TrackingSystem }) {
  const brand = BRAND[system]

  return (
    <div
      className={`flex min-h-full flex-col items-center justify-center bg-gradient-to-br ${brand.gradient} px-6 py-10 text-white`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-sm">
        金
      </div>
      <p className="text-lg font-semibold tracking-tight">{brand.name}</p>
      <p className="mt-1 text-sm text-white/80">{brand.sub}</p>
      <div className="mt-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-white/90"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-white/70">正在启动…</p>
    </div>
  )
}

export function TrackingLoginView({ system }: { system: TrackingSystem }) {
  const screen = useWorkflowStore((s) => s.trackingScreen)
  const brand = BRAND[system]
  const progress = screen.loginProgress ?? 0

  return (
    <div className="flex min-h-full flex-col bg-[#F5F6FA] p-4">
      <div className="mx-auto mt-6 w-full max-w-[240px] rounded-2xl bg-white p-5 shadow-soft">
        <div
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: brand.accent }}
        >
          金
        </div>
        <p className="text-sm font-semibold text-ink">账号登录</p>
        <p className="mt-0.5 text-[11px] text-muted">{brand.sub}</p>
        <div className="mt-4 space-y-2">
          <div className="rounded-lg border border-[#E5E5EA] bg-[#FAFAFA] px-3 py-2 text-xs text-muted">
            agent.ops@wilmar.cn
          </div>
          <div className="rounded-lg border border-[#E5E5EA] bg-[#FAFAFA] px-3 py-2 text-xs tracking-widest text-muted">
            ••••••••
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E8E8ED]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: brand.accent }}
          />
        </div>
        <p className="mt-2 text-center text-[10px] text-muted">{screen.statusText}</p>
      </div>
    </div>
  )
}
