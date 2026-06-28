import { Clock } from './clock'
import { KioskBackButton } from './back-button'

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <KioskBackButton />
          <span className="text-xl font-bold text-[#0D65F2]">BrightMind</span>
        </div>
        <Clock />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
