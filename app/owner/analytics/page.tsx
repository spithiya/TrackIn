import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './analytics-client'

export default async function OwnerAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: history } = await supabase
    .from('visit_history')
    .select('checked_in_at, duration_minutes, subjects_snapshot, checkin_method')
    .eq('org_id', profile.org_id)
    .gte('checked_in_at', thirtyDaysAgo.toISOString())
    .order('checked_in_at', { ascending: true })

  return <AnalyticsClient history={history ?? []} />
}
