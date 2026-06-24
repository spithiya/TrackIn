import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './analytics-client'
import { getLocationFilter } from '@/lib/location-filter'

export default async function OwnerAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const locationIds = await getLocationFilter()
  // 180 days: 90-day view + 90-day prior period for trend comparison
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 180)

  let query = supabase
    .from('visit_history')
    .select('checked_in_at, duration_minutes, subjects_snapshot, checkin_method')
    .eq('org_id', profile.org_id)
    .gte('checked_in_at', cutoff.toISOString())
    .order('checked_in_at', { ascending: true })

  if (locationIds.length > 0) query = query.in('location_id', locationIds)

  const { data: history } = await query

  return <AnalyticsClient history={history ?? []} />
}
