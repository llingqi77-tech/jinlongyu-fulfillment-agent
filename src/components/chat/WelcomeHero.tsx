import { WelcomeSubtitle } from './WelcomeSubtitle'

export function WelcomeHero() {
  return (
    <div className="flex flex-1 flex-col justify-center px-8 py-10">
      <h1 className="text-left font-extrabold leading-[1.1] tracking-tight">
        <span className="block bg-gradient-to-r from-[var(--color-chat-primary)] via-[#3b82f6] to-[#60a5fa] bg-clip-text text-[60px] text-transparent">
          Hi，
        </span>
        <span className="mt-1 block bg-gradient-to-r from-[var(--color-chat-primary)] via-[#3b82f6] to-[#60a5fa] bg-clip-text text-[32px] text-transparent">
          我是你的完美履约助手
        </span>
      </h1>
      <WelcomeSubtitle className="mt-5" />
    </div>
  )
}
