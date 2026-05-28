import { useEffect, useState } from 'react'
import { useShortageStore } from '../../../store/shortageStore'

const CAPABILITIES = [
  { icon: '🔄', text: '今日缺货同步' },
  { icon: '💡', text: '缺货履约建议' },
  { icon: '💬', text: '销售沟通协助' },
  { icon: '📦', text: '采购寻源推进' },
]

const STATUS_STEPS = [
  '正在连接履约数据…',
  '正在加载今日缺货…',
  '正在配置智能技能…',
  '即将激活完成…',
]

const ACTIVATION_MS = 3200
const STEP_MS = 800

export function MobileAgentActivating() {
  const finishMobileActivation = useShortageStore((s) => s.finishMobileActivation)
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min(100, Math.round((elapsed / ACTIVATION_MS) * 100)))
    }, 50)

    const stepTimer = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STATUS_STEPS.length - 1))
    }, STEP_MS)

    const done = window.setTimeout(() => finishMobileActivation(), ACTIVATION_MS)

    return () => {
      clearInterval(tick)
      clearInterval(stepTimer)
      clearTimeout(done)
    }
  }, [finishMobileActivation])

  return (
    <div className="mobile-agent-activating">
      <h2 className="mobile-agent-activating__title">正在激活你的智能履约助手</h2>
      <p className="mobile-agent-activating__sub">
        关闭当前窗口不影响激活，完成后你将会收到消息推送
      </p>

      <div className="mobile-agent-activating__spinner-wrap" aria-hidden>
        <div className="mobile-agent-activating__spinner" />
        <div className="mobile-agent-activating__spinner-core">AI</div>
      </div>

      <p className="mobile-agent-activating__status" role="status" aria-live="polite">
        {STATUS_STEPS[stepIndex]}
      </p>

      <div className="mobile-agent-activating__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="mobile-agent-activating__progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mobile-agent-activating__cards" aria-hidden>
        <div className="mobile-agent-activating__card mobile-agent-activating__card--back" />
        <div className="mobile-agent-activating__card mobile-agent-activating__card--mid" />
        <div className="mobile-agent-activating__card mobile-agent-activating__card--front mobile-agent-activating__card--spin">
          <ul className="mobile-agent-activating__features">
            {CAPABILITIES.map((c, i) => (
              <li
                key={c.text}
                className="mobile-agent-activating__feature"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <span>{c.icon}</span>
                {c.text}
              </li>
            ))}
          </ul>
          <p className="mobile-agent-activating__card-title">每天进步一点点</p>
          <p className="mobile-agent-activating__card-sub">不断解锁新技能，和你一起完成履约</p>
        </div>
      </div>
    </div>
  )
}
