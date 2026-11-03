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
    .select('id, is_active, location_id, location_ids, can_manage_students, can_view_history, can_view_analytics, can_control_checkin')
    .eq('profile_id', user.id)
    .maybeSingle()

  // Deactivation bans the login, but a session opened before that stays
  // valid until its token expires — don't let it keep using the portal.
  if (member && !member.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FF] p-6">
        <div className="max-w-sm w-full bg-white rounded-xl border border-[#BECDE8] p-6 text-center space-y-4">
          <h1 className="text-lg font-semibold text-[#0F2040]">Account deactivated</h1>
          <p className="text-sm text-slate-600">
            Your staff account has been deactivated. If you think this is a mistake, contact the owner.
          </p>
          <div className="flex justify-center">
            <SignOutButton variant="header" />
          </div>
        </div>
      </div>
    )
  }

  const locationIds = member
    ? [member.location_id, ...(member.location_ids ?? [])]
    : []

  const permissions = {
    manage_students: member?.can_manage_students ?? false,
    view_history: member?.can_view_history ?? false,
    view_analytics: member?.can_view_analytics ?? false,
    control_checkin: member?.can_control_checkin ?? false,
  }

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <MobileSidebarFrame className="w-56 bg-[#0F2040] flex flex-col shrink-0">
          <div className="px-6 py-5 border-b border-white/10">
            <span className="text-lg font-bold text-white">TrackIn</span>
            <p className="text-xs text-white/45 mt-0.5 font-medium tracking-wide uppercase">Staff Portal</p>
          </div>
          <StaffNav permissions={permissions} />
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
            <div className="flex items-center gap-2">
              <NotificationBell orgId={profile.org_id} staffId={member?.id ?? null} locationIds={locationIds} />
              <SignOutButton variant="header" />
            </div>
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
