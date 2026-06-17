import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OwnerCheckinClient } from './checkin-client'
import { getLocationFilter } from '@/lib/location-filter'

export default async function OwnerCheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: staffMembers }, locationIds] = await Promise.all([
    supabase
      .from('staff_members')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('is_active', true)
      .order('first_name'),
    getLocationFilter(),
  ])

  return (
    <OwnerCheckinClient
      orgId={profile.org_id}
      staffMembers={staffMembers ?? []}
      locationIds={locationIds}
    />
  )
}
