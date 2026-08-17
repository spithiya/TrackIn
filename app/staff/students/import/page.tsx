import { createClient } from '@/lib/supabase/server'
import { ImportStudentsClient } from '../../../owner/students/import/import-client'
import { requireAccess } from '@/lib/permissions'

export default async function StaffImportStudentsPage() {
  const access = await requireAccess('manage_students')
  const supabase = await createClient()

  const [{ data: locations }, { data: existingStudents }] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', access.orgId)
      .eq('is_active', true),
    supabase
      .from('students')
      .select('first_name, last_name')
      .eq('org_id', access.orgId)
      .eq('is_active', true),
  ])

  const existingNames = (existingStudents ?? []).map(
    s => `${s.first_name.toLowerCase()}|${s.last_name.toLowerCase()}`
  )

  return (
    <ImportStudentsClient
      locations={locations ?? []}
      existingNames={existingNames}
      basePath="/staff"
    />
  )
}
