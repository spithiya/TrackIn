'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'

type HistoryRow = {
  checked_in_at: string
  duration_minutes: number
  subjects_snapshot: 'math' | 'reading' | 'both'
  checkin_method: 'kiosk' | 'staff'
}

const SUBJECT_COLORS = { Math: '#0D9488', Reading: '#534AB7', 'Math + Reading': '#F59E0B' }
const METHOD_COLORS = { Kiosk: '#0D9488', Staff: '#94A3B8' }

export function AnalyticsClient({ history }: { history: HistoryRow[] }) {
  const visitsByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      map.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0)
    }
    history.forEach(v => {
      const key = new Date(v.checked_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (map.has(key)) map.set(key, map.get(key)! + 1)
    })
    return Array.from(map, ([date, count]) => ({ date, count }))
  }, [history])

  const subjectData = useMemo(() => {
    const counts = { math: 0, reading: 0, both: 0 }
    history.forEach(v => counts[v.subjects_snapshot]++)
    return [
      { name: 'Math', value: counts.math },
      { name: 'Reading', value: counts.reading },
      { name: 'Math + Reading', value: counts.both },
    ].filter(d => d.value > 0)
  }, [history])

  const methodData = useMemo(() => {
    const kiosk = history.filter(v => v.checkin_method === 'kiosk').length
    const staff = history.filter(v => v.checkin_method === 'staff').length
    return [
      { name: 'Kiosk', value: kiosk },
      { name: 'Staff', value: staff },
    ].filter(d => d.value > 0)
  }, [history])

  const avgDuration = useMemo(() => {
    if (!history.length) return 0
    return Math.round(history.reduce((s, v) => s + v.duration_minutes, 0) / history.length)
  }, [history])

  const totalVisits = history.length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
      <p className="text-sm text-slate-500 -mt-4">Last 30 days</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total Visits" value={totalVisits} />
        <MetricCard label="Avg Session" value={avgDuration ? `${avgDuration}m` : '—'} />
        <MetricCard
          label="Top Subject"
          value={
            subjectData.length
              ? subjectData.sort((a, b) => b.value - a.value)[0].name
              : '—'
          }
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Visits Per Day</CardTitle></CardHeader>
        <CardContent>
          {!totalVisits ? (
            <p className="text-sm text-slate-400 py-10 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={visitsByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F0FDFA' }}
                />
                <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Subjects Breakdown</CardTitle></CardHeader>
          <CardContent>
            {!subjectData.length ? (
              <p className="text-sm text-slate-400 py-10 text-center">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectData.map(entry => (
                      <Cell key={entry.name} fill={SUBJECT_COLORS[entry.name as keyof typeof SUBJECT_COLORS] ?? '#CBD5E1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Check-in Method</CardTitle></CardHeader>
          <CardContent>
            {!methodData.length ? (
              <p className="text-sm text-slate-400 py-10 text-center">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {methodData.map(entry => (
                      <Cell key={entry.name} fill={METHOD_COLORS[entry.name as keyof typeof METHOD_COLORS] ?? '#CBD5E1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
