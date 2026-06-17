import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Clock } from './clock'

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
            <ArrowLeft size={16} />
            Back
          </Link>
          <span className="text-xl font-bold text-[#0D9488]">BrightMind</span>
        </div>
        <Clock />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
