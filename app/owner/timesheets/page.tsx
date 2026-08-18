import { createClient } from '@/lib/supabase/server'
import { TimesheetsClient } from './timesheets-client'
import { getLocationFilter } from '@/lib/location-filter'
import { requireOwner } from '@/lib/permissions'

export default async function OwnerTimesheetsPage() {
  const access = await requireOwner()
  const supabase = await createClient()

  const [{ data: locations }, { data: staffMembers }, globalLocationIds] = await Promise.all([
    supabase.from('locations').select('id, name, opens_at, closes_at').eq('org_id', access.orgId),
    supabase
      .from('staff_members')
      .select('id, first_name, last_name, location_id')
      .eq('org_id', access.orgId)
      .eq('is_active', true)
      .order('last_name'),
    getLocationFilter(),
  ])

  return (
    <TimesheetsClient
      orgId={access.orgId}
      ownerId={access.userId}
      locations={locations ?? []}
      staffList={staffMembers ?? []}
      globalLocationIds={globalLocationIds}
    />
  )
}
