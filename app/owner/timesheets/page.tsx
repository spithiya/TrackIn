import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimesheetsClient } from './timesheets-client'

export default async function OwnerTimesheetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: locations }, { data: staffMembers }] = await Promise.all([
    supabase.from('locations').select('id, name').eq('org_id', profile.org_id),
    supabase
      .from('staff_members')
      .select('id, first_name, last_name')
      .eq('org_id', profile.org_id)
      .eq('is_active', true)
      .order('last_name'),
  ])

  return (
    <TimesheetsClient
      orgId={profile.org_id}
      locations={locations ?? []}
      staffList={staffMembers ?? []}
    />
  )
}
