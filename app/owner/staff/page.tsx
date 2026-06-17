import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffClient } from './staff-client'
import { getLocationFilter } from '@/lib/location-filter'

export default async function OwnerStaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const locationIds = await getLocationFilter()

  let staffQuery = supabase
    .from('staff_members')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)
    .order('last_name', { ascending: true })

  if (locationIds.length > 0) staffQuery = staffQuery.in('location_id', locationIds)

  const [{ data: staff }, { data: locations }] = await Promise.all([
    staffQuery,
    supabase.from('locations').select('id, name').eq('org_id', profile.org_id),
  ])

  return <StaffClient staff={staff ?? []} locations={locations ?? []} />
}
