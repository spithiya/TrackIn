import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiveClient } from './live-client'

export default async function OwnerLivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  return <LiveClient orgId={profile.org_id} />
}
