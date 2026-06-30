import { Clock } from './clock'
import { KioskBackButton } from './back-button'

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8FA]">
      <header className="flex items-center justify-between px-6 py-4 bg-[#2D2D3A]">
        <div className="flex items-center gap-3">
          <KioskBackButton />
          <span className="text-xl font-bold text-white">BrightMind</span>
        </div>
        <Clock />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="py-3 text-center text-xs text-[#2D2D3A]/40">
        © 2026 BrightMind. All rights reserved.
      </footer>
    </div>
  )
}
