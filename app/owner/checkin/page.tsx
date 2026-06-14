import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OwnerCheckinClient } from './checkin-client'

export default async function OwnerCheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: staffMembers } = await supabase
    .from('staff_members')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)
    .order('first_name')

  return (
    <OwnerCheckinClient
      orgId={profile.org_id}
      staffMembers={staffMembers ?? []}
    />
  )
}
