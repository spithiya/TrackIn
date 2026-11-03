import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StaffDetailClient } from './staff-detail-client'
import { requireOwner } from '@/lib/permissions'

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireOwner()
  const supabase = await createClient()

  const [{ data: member }, { data: locations }] = await Promise.all([
    supabase
      .from('staff_members')
      .select('*')
      .eq('id', id)
      .eq('org_id', access.orgId)
      .single(),
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', access.orgId),
  ])

  if (!member) notFound()

  // Delete is only offered when it wouldn't erase history; otherwise the
  // owner deactivates instead (see deleteStaff).
  const [{ count: checkinsCount }, { count: notifCount }] = await Promise.all([
    supabase.from('staff_checkins').select('*', { count: 'exact', head: true }).eq('staff_id', id).eq('org_id', access.orgId),
    supabase.from('staff_notifications').select('*', { count: 'exact', head: true }).eq('staff_id', id).eq('org_id', access.orgId),
  ])
  const hasHistory = (checkinsCount ?? 0) > 0 || (notifCount ?? 0) > 0

  let username: string | null = null
  if (member.profile_id) {
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', member.profile_id).single()
    username = profile?.username ?? null
  }

  return <StaffDetailClient member={member} locations={locations ?? []} initialUsername={username} hasHistory={hasHistory} />
}
