import { createClient } from '@/lib/supabase/server'
import { ImportStudentsClient } from './import-client'
import { requireAccess } from '@/lib/permissions'

export default async function ImportStudentsPage() {
  const access = await requireAccess('manage_students')
  const supabase = await createClient()

  const [{ count: locationCount }, { data: existingStudents }] = await Promise.all([
    supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
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
      hasLocation={(locationCount ?? 0) > 0}
      existingNames={existingNames}
    />
  )
}
