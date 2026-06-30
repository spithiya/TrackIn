import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffNav } from './staff-nav'
import { SignOutButton } from './sign-out-button'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'staff') redirect('/')

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-[#1E3A6E] flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold text-white">BrightMind</span>
          <p className="text-xs text-white/45 mt-0.5 font-medium tracking-wide uppercase">Staff Portal</p>
        </div>
        <StaffNav />
        <div className="px-3 py-4 border-t border-white/10">
          <SignOutButton />
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#D6E3FF] px-6 py-3.5 flex items-center justify-between">
          <span className="text-sm font-medium text-[#3B6FD4]">Staff Portal</span>
        </header>
        <main className="flex-1 p-6 bg-[#F4F7FF]">{children}</main>
        <footer className="px-6 py-2.5 border-t border-[#D6E3FF] bg-white text-xs text-gray-400 text-center">
          © 2026 BrightMind. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
