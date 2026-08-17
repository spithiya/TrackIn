import { createClient } from '@/lib/supabase/server'
import { HistoryClient } from './history-client'
import { getLocationFilter } from '@/lib/location-filter'
import { requireAccess } from '@/lib/permissions'

export default async function OwnerHistoryPage() {
  const access = await requireAccess('view_history')
  const supabase = await createClient()

  const [{ data: locations }, globalLocationIds] = await Promise.all([
    supabase.from('locations').select('id, name').eq('org_id', access.orgId),
    getLocationFilter(),
  ])

  return (
    <HistoryClient
      orgId={access.orgId}
      locations={locations ?? []}
      globalLocationIds={globalLocationIds}
    />
  )
}
