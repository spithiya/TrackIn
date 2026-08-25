import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StaffDetailClient } from './staff-detail-client'
import { requireOwner } from '@/lib/permissions'

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireOwner()
  const supabase = await createClient()

  const [{ data: member }, { data: locations }] = await Promise.all([
    supabase
      .from('staff_members')
      .select('*')
      .eq('id', id)
      .eq('org_id', access.orgId)
      .single(),
    supabase
      .from('locations')
      .select('id, name')
      .eq('org_id', access.orgId),
  ])

  if (!member) notFound()

  let username: string | null = null
  if (member.profile_id) {
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', member.profile_id).single()
    username = profile?.username ?? null
  }

  return <StaffDetailClient member={member} locations={locations ?? []} initialUsername={username} />
}
