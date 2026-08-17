import { createClient } from '@/lib/supabase/server'
import { StaffClient } from './staff-client'
import { getLocationFilter } from '@/lib/location-filter'
import { requireOwner } from '@/lib/permissions'

export default async function OwnerStaffPage() {
  const access = await requireOwner()
  const supabase = await createClient()
  const locationIds = await getLocationFilter()

  let staffQuery = supabase
    .from('staff_members')
    .select('*')
    .eq('org_id', access.orgId)
    .eq('is_active', true)
    .order('last_name', { ascending: true })

  if (locationIds.length > 0) staffQuery = staffQuery.in('location_id', locationIds)

  const [{ data: staff }, { data: locations }] = await Promise.all([
    staffQuery,
    supabase.from('locations').select('id, name').eq('org_id', access.orgId),
  ])

  return <StaffClient staff={staff ?? []} locations={locations ?? []} />
}
