import { createClient } from '@/lib/supabase/server'
import { OwnerCheckinClient } from './checkin-client'
import { getLocationFilter } from '@/lib/location-filter'
import { requireAccess } from '@/lib/permissions'

export default async function OwnerCheckinPage() {
  const access = await requireAccess('control_checkin')
  const supabase = await createClient()

  const [{ data: staffMembers }, locationIds] = await Promise.all([
    supabase
      .from('staff_members')
      .select('*')
      .eq('org_id', access.orgId)
      .eq('is_active', true)
      .order('first_name'),
    getLocationFilter(),
  ])

  return (
    <OwnerCheckinClient
      orgId={access.orgId}
      staffMembers={staffMembers ?? []}
      locationIds={locationIds}
    />
  )
}
