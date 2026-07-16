import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { StaffDetailClient } from './staff-detail-client'

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const [{ data: member }, { data: locations }] = await Promise.all([
    supabase
      .from('staff_members')
      .select('*')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single(),
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', profile.org_id),
  ])

  if (!member) notFound()

  return <StaffDetailClient member={member} locations={locations ?? []} />
}
