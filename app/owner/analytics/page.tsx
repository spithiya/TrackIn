import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from './analytics-client'
import { requireAccess } from '@/lib/permissions'

export default async function OwnerAnalyticsPage() {
  const access = await requireAccess('view_analytics')
  const supabase = await createClient()
  const profile = { org_id: access.orgId }

  // 180 days: 90-day view + 90-day prior period for trend comparison
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 180)

  const { data: history } = await supabase
    .from('visit_history')
    .select('checked_in_at, duration_minutes, subjects_snapshot, checkin_method')
    .eq('org_id', profile.org_id)
    .gte('checked_in_at', cutoff.toISOString())
    .order('checked_in_at', { ascending: true })

  return <AnalyticsClient history={history ?? []} />
}
