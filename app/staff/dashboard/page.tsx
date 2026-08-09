import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function StaffDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, org_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/auth/login')

  const { data: member } = await supabase
    .from('staff_members')
    .select('id, location_id, location_ids')
    .eq('profile_id', profile.id)
    .maybeSingle()

  const locationIds = member
    ? [member.location_id, ...(member.location_ids ?? [])]
    : []

  return <DashboardClient orgId={profile.org_id} locationIds={locationIds} staffId={member?.id ?? null} />
}
