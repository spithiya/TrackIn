import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from './history-client'
import { getLocationFilter } from '@/lib/location-filter'

export default async function OwnerHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: locations }, globalLocationIds] = await Promise.all([
    supabase.from('locations').select('id, name').eq('org_id', profile.org_id),
    getLocationFilter(),
  ])

  return (
    <HistoryClient
      orgId={profile.org_id}
      locations={locations ?? []}
      globalLocationIds={globalLocationIds}
    />
  )
}
