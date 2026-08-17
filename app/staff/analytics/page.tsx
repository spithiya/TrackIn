import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from '../../owner/analytics/analytics-client'
import { getLocationFilter } from '@/lib/location-filter'
import { requireAccess } from '@/lib/permissions'

export default async function StaffAnalyticsPage() {
  const access = await requireAccess('view_analytics')
  const supabase = await createClient()
  const orgId = access.orgId

  const locationIds = await getLocationFilter()
  // 180 days: 90-day view + 90-day prior period for trend comparison
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 180)

  let query = supabase
    .from('visit_history')
    .select('checked_in_at, duration_minutes, subjects_snapshot, checkin_method')
    .eq('org_id', orgId)
    .gte('checked_in_at', cutoff.toISOString())
    .order('checked_in_at', { ascending: true })

  if (locationIds.length > 0) query = query.in('location_id', locationIds)

  const { data: history } = await query

  return <AnalyticsClient history={history ?? []} />
}
