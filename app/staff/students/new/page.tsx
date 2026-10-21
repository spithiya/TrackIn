import { createClient } from '@/lib/supabase/server'
import { AddStudentForm } from '../../../owner/students/new/add-student-form'
import { requireAccess } from '@/lib/permissions'

export default async function StaffAddStudentPage() {
  const access = await requireAccess('manage_students')
  const supabase = await createClient()

  const { count } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', access.orgId)
    .eq('is_active', true)

  return <AddStudentForm hasLocation={(count ?? 0) > 0} basePath="/staff" />
}
