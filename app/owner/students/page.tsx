import { createClient } from '@/lib/supabase/server'
import { StudentsClient } from './students-client'
import { getLocationFilter } from '@/lib/location-filter'
import { requireAccess } from '@/lib/permissions'

export default async function StudentRecordsPage() {
  const access = await requireAccess('manage_students')
  const supabase = await createClient()
  const locationIds = await getLocationFilter()

  let studentsQuery = supabase
    .from('students')
    .select('*')
    .eq('org_id', access.orgId)
    .eq('is_active', true)
    .order('last_name', { ascending: true })

  if (locationIds.length > 0) studentsQuery = studentsQuery.in('location_id', locationIds)

  const [{ data: students }, { data: locations }] = await Promise.all([
    studentsQuery,
    supabase.from('locations').select('id, name').eq('org_id', access.orgId),
  ])

  return <StudentsClient students={students ?? []} locations={locations ?? []} />
}
