import type { WorkbenchNav, WorkbenchRole } from '../../types/shortage'
import { useShortageStore } from '../../store/shortageStore'

const ROLE_HOME_LABEL: Record<WorkbenchRole, string> = {
  ops: '履约进度总览',
  sales: '缺货沟通总览',
  procurement: '缺货寻源总览',
}

export function WorkbenchNav() {
  const nav = useShortageStore((s) => s.nav)
  const role = useShortageStore((s) => s.role)
  const setNav = useShortageStore((s) => s.setNav)

  const items: { id: WorkbenchNav; label: string }[] = [
    { id: 'home', label: ROLE_HOME_LABEL[role] },
    { id: 'tasks', label: '我的任务' },
  ]

  return (
    <nav className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-pale-stone/15 bg-segment-track/30 p-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setNav(item.id)}
          className={`rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
            nav === item.id
              ? 'bg-off-black text-paper-canvas'
              : 'text-ink hover:bg-segment-track'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
