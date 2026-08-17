import { createClient } from '@/lib/supabase/server'
import { LocationsClient } from './locations-client'
import { requireOwner } from '@/lib/permissions'

export default async function OwnerLocationsPage() {
  const access = await requireOwner()
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('org_id', access.orgId)
    .order('name')

  return <LocationsClient locations={locations ?? []} />
}
