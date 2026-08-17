import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffNav } from './staff-nav'
import { SignOutButton } from './sign-out-button'
import { NotificationBell } from '@/components/staff/notification-bell'
import { MobileSidebarProvider, MobileSidebarFrame, SidebarToggleButton } from '@/components/layout/mobile-sidebar'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, org_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'staff') redirect('/')

  const { data: member } = await supabase
    .from('staff_members')
    .select('id, location_id, location_ids')
    .eq('profile_id', user.id)
    .maybeSingle()

  const locationIds = member
    ? [member.location_id, ...(member.location_ids ?? [])]
    : []

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <MobileSidebarFrame className="w-56 bg-[#0F2040] flex flex-col shrink-0">
          <div className="px-6 py-5 border-b border-white/10">
            <span className="text-lg font-bold text-white">TrackIn</span>
            <p className="text-xs text-white/45 mt-0.5 font-medium tracking-wide uppercase">Staff Portal</p>
          </div>
          <StaffNav />
          <div className="px-3 py-4 border-t border-white/10">
            <SignOutButton />
          </div>
        </MobileSidebarFrame>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-[#BECDE8] px-4 lg:px-6 py-3.5 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarToggleButton className="text-[#1B3A6B]" />
              <span className="text-sm font-medium text-[#1B3A6B] truncate">Staff Portal</span>
            </div>
            <NotificationBell orgId={profile.org_id} staffId={member?.id ?? null} locationIds={locationIds} />
          </header>
          <main className="flex-1 p-4 lg:p-6 bg-[#F4F7FF]">{children}</main>
          <footer className="px-6 py-2.5 border-t border-[#BECDE8] bg-white text-xs text-gray-400 text-center">
            © 2026 TrackIn. All rights reserved.
          </footer>
        </div>
      </div>
    </MobileSidebarProvider>
  )
}
