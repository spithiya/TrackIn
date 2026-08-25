import { createClient } from '@/lib/supabase/server'
import { StudentsClient } from '../../owner/students/students-client'
import { requireAccess } from '@/lib/permissions'

export default async function StaffStudentsPage() {
  const access = await requireAccess('manage_students')
  const supabase = await createClient()

  const [{ data: students }, { data: locations }] = await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('org_id', access.orgId)
      .eq('is_active', true)
      .order('last_name', { ascending: true }),
    supabase.from('locations').select('id, name').eq('org_id', access.orgId),
  ])

  return <StudentsClient students={students ?? []} locations={locations ?? []} basePath="/staff" />
}
