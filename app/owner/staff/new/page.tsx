import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RegisterStaffForm } from './register-staff-form'

export default async function RegisterStaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)

  return <RegisterStaffForm locations={locations ?? []} />
}
