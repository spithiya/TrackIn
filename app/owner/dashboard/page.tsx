import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MetricCard } from '@/components/ui/metric-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SubjectTags } from '@/components/students/subject-tags'
import { formatDate, formatDuration } from '@/lib/utils'
import { getLocationFilter } from '@/lib/location-filter'

export default async function OwnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const orgId = profile.org_id
  const locationIds = await getLocationFilter()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  function applyLocationFilter<T extends object>(query: T): T {
    if (locationIds.length === 0) return query
    return (query as any).in('location_id', locationIds) as T
  }

  const [
    { data: activeStudents },
    { data: activeStaff },
    { count: todayVisits },
    { count: totalStudents },
    { data: recentHistory },
  ] = await Promise.all([
    applyLocationFilter(supabase.from('active_students').select('*').eq('org_id', orgId)),
    applyLocationFilter(supabase.from('active_staff').select('*').eq('org_id', orgId)),
    applyLocationFilter(
      supabase
        .from('student_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('checked_in_at', todayStart.toISOString())
    ),
    applyLocationFilter(
      supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('is_active', true)
    ),
    applyLocationFilter(
      supabase
        .from('visit_history')
        .select('*')
        .eq('org_id', orgId)
        .order('checked_out_at', { ascending: false })
        .limit(6)
    ),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#252E3D]">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Students In Now"
          value={activeStudents?.length ?? 0}
          variant={activeStudents?.length ? 'green' : 'default'}
        />
        <MetricCard
          label="Staff Clocked In"
          value={activeStaff?.length ?? 0}
          variant={activeStaff?.length ? 'green' : 'default'}
        />
        <MetricCard label="Visits Today" value={todayVisits ?? 0} />
        <MetricCard label="Total Students" value={totalStudents ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Visits</CardTitle>
              <Link href="/owner/history" className="text-xs text-[#3D4A5C] hover:text-[#252E3D] flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!recentHistory?.length ? (
              <p className="text-sm text-slate-400 py-6 text-center">No visits recorded yet.</p>
            ) : (
              <div>
                {recentHistory.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{v.student_first_name} {v.student_last_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(v.checked_in_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SubjectTags subjects={v.subjects_snapshot} />
                      <span className="text-xs text-slate-400 font-mono">{formatDuration(v.duration_minutes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Currently In</CardTitle>
              <Link href="/owner/live" className="text-xs text-[#3D4A5C] hover:text-[#252E3D] flex items-center gap-1">
                Live view <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!activeStudents?.length ? (
              <p className="text-sm text-slate-400 py-6 text-center">No students checked in right now.</p>
            ) : (
              <div>
                {activeStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.student_first_name} {s.student_last_name}</p>
                      <div className="mt-0.5"><SubjectTags subjects={s.subjects_snapshot} /></div>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{s.elapsed_minutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
