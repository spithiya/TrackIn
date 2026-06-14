import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentsClient } from './students-client'

export default async function StudentRecordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: students }, { data: locations }] = await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('last_name', { ascending: true }),
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', profile.org_id),
  ])

  return <StudentsClient students={students ?? []} locations={locations ?? []} />
}
