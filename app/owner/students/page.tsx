import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentsClient } from './students-client'
import { getLocationFilter } from '@/lib/location-filter'

export default async function StudentRecordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const locationIds = await getLocationFilter()

  let studentsQuery = supabase
    .from('students')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)
    .order('last_name', { ascending: true })

  if (locationIds.length > 0) studentsQuery = studentsQuery.in('location_id', locationIds)

  const [{ data: students }, { data: locations }] = await Promise.all([
    studentsQuery,
    supabase.from('locations').select('id, name').eq('org_id', profile.org_id),
  ])

  return <StudentsClient students={students ?? []} locations={locations ?? []} />
}
