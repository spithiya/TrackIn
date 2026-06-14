import { Clock } from './clock'

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <span className="text-xl font-bold text-[#0D9488]">BrightMind</span>
        <Clock />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
