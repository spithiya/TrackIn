import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LocationsClient } from './locations-client'

export default async function OwnerLocationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name')

  return <LocationsClient locations={locations ?? []} />
}
