import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddStudentForm } from './add-student-form'

export default async function AddStudentPage() {
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

  return <AddStudentForm orgId={profile.org_id} locations={locations ?? []} />
}
