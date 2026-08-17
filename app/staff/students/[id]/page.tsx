import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StudentDetailClient } from '../../../owner/students/[id]/student-detail-client'
import { requireAccess } from '@/lib/permissions'

export default async function StaffStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireAccess('manage_students')
  const supabase = await createClient()

  const [{ data: student }, { data: contacts }, { data: locations }] = await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('org_id', access.orgId)
      .single(),
    supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', id)
      .order('is_primary', { ascending: false }),
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', access.orgId)
      .eq('is_active', true),
  ])

  if (!student) notFound()

  return (
    <StudentDetailClient
      student={student}
      contacts={contacts ?? []}
      locations={locations ?? []}
      orgId={access.orgId}
      basePath="/staff"
    />
  )
}
