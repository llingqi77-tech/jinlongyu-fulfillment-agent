import { WelcomeSubtitle } from './WelcomeSubtitle'

export function WelcomeHero() {
  return (
    <div className="flex flex-1 flex-col justify-center px-8 py-10">
      <h1 className="font-display text-left font-normal leading-[1.15] tracking-[-0.02em] text-ink">
        <span className="block text-[40px]">Hi，</span>
        <span className="mt-1 block text-[28px]">我是你的完美履约助手</span>
      </h1>
      <WelcomeSubtitle className="mt-5" />
    </div>
  )
}
