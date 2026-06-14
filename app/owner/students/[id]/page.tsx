import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { StudentDetailClient } from './student-detail-client'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: student }, { data: contacts }, { data: locations }] = await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', profile.org_id)
      .single(),
    supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', params.id)
      .order('is_primary', { ascending: false }),
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', profile.org_id)
      .eq('is_active', true),
  ])

  if (!student) notFound()

  return (
    <StudentDetailClient
      student={student}
      contacts={contacts ?? []}
      locations={locations ?? []}
      orgId={profile.org_id}
    />
  )
}
