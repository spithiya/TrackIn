import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportStudentsClient } from './import-client'

export default async function ImportStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: locations }, { data: existingStudents }] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', profile.org_id)
      .eq('is_active', true),
    supabase
      .from('students')
      .select('first_name, last_name')
      .eq('org_id', profile.org_id)
      .eq('is_active', true),
  ])

  const existingNames = (existingStudents ?? []).map(
    s => `${s.first_name.toLowerCase()}|${s.last_name.toLowerCase()}`
  )

  return (
    <ImportStudentsClient
      locations={locations ?? []}
      existingNames={existingNames}
    />
  )
}
