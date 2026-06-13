export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-[#534AB7]">BrightMind</span>
        <Clock />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}

function Clock() {
  'use client'
  // Placeholder — will be replaced with live clock component
  return <span className="text-sm text-gray-500 font-mono" suppressHydrationWarning />
}
