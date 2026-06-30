'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { cn } from '@/lib/utils'

type HistoryRow = {
  checked_in_at: string
  duration_minutes: number
  subjects_snapshot: 'math' | 'reading' | 'both'
  checkin_method: 'kiosk' | 'staff'
}

const DAYS_OPTIONS = [7, 30, 90] as const
type DaysOption = typeof DAYS_OPTIONS[number]

const SUBJECT_COLORS = { Math: '#0D65F2', Reading: '#534AB7', 'Math + Reading': '#F59E0B' }
const TOOLTIP_STYLE = { borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }

function trendPct(curr: number, prev: number): number | undefined {
  if (!prev) return undefined
  return Math.round(((curr - prev) / prev) * 100)
}

export function AnalyticsClient({ history }: { history: HistoryRow[] }) {
  const [days, setDays] = useState<DaysOption>(30)

  const { current, previous } = useMemo(() => {
    const now = new Date()
    const periodStart = new Date(now)
    periodStart.setDate(now.getDate() - days)
    const prevStart = new Date(periodStart)
    prevStart.setDate(periodStart.getDate() - days)

    return {
      current: history.filter(v => new Date(v.checked_in_at) >= periodStart),
      previous: history.filter(v => {
        const d = new Date(v.checked_in_at)
        return d >= prevStart && d < periodStart
      }),
    }
  }, [history, days])

  // Daily bars for 7d, weekly buckets for 30d/90d
  const visitsByPeriod = useMemo(() => {
    if (days === 7) {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const dayEnd = new Date(dayStart.getTime() + 86_400_000)
        return {
          date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          count: current.filter(v => {
            const t = new Date(v.checked_in_at)
            return t >= dayStart && t < dayEnd
          }).length,
        }
      })
    }

    const numWeeks = Math.ceil(days / 7)
    const now = new Date()
    const periodStart = new Date(now)
    periodStart.setDate(now.getDate() - days)

    return Array.from({ length: numWeeks }, (_, i) => {
      const weekStart = new Date(periodStart)
      weekStart.setDate(periodStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      if (weekEnd > now) weekEnd.setTime(now.getTime())

      return {
        date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: current.filter(v => {
          const t = new Date(v.checked_in_at)
          return t >= weekStart && t < weekEnd
        }).length,
      }
    })
  }, [current, days])

  // Peak check-in hours (7am–9pm)
  const peakHours = useMemo(() => {
    const counts = new Array(24).fill(0)
    current.forEach(v => counts[new Date(v.checked_in_at).getHours()]++)
    return Array.from({ length: 15 }, (_, i) => {
      const h = i + 7
      return {
        hour: h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
        count: counts[h],
      }
    })
  }, [current])

  // Subject breakdown
  const subjectData = useMemo(() => {
    const counts = { math: 0, reading: 0, both: 0 }
    current.forEach(v => counts[v.subjects_snapshot]++)
    return [
      { name: 'Math', value: counts.math },
      { name: 'Reading', value: counts.reading },
      { name: 'Math + Reading', value: counts.both },
    ].filter(d => d.value > 0)
  }, [current])

  // Session duration histogram
  const durationBuckets = useMemo(() => {
    const b = [0, 0, 0, 0]
    current.forEach(v => {
      const m = v.duration_minutes
      if (m <= 30) b[0]++
      else if (m <= 60) b[1]++
      else if (m <= 90) b[2]++
      else b[3]++
    })
    return [
      { range: '0–30m', count: b[0] },
      { range: '31–60m', count: b[1] },
      { range: '61–90m', count: b[2] },
      { range: '90m+', count: b[3] },
    ]
  }, [current])

  // Check-in method split
  const methodStats = useMemo(() => {
    const kiosk = current.filter(v => v.checkin_method === 'kiosk').length
    const staff = current.filter(v => v.checkin_method === 'staff').length
    const total = kiosk + staff
    return {
      kiosk,
      staff,
      total,
      kioskPct: total ? Math.round((kiosk / total) * 100) : 0,
    }
  }, [current])

  const totalVisits = current.length
  const prevVisits = previous.length
  const avgDuration = current.length
    ? Math.round(current.reduce((s, v) => s + v.duration_minutes, 0) / current.length)
    : 0
  const prevAvgDuration = previous.length
    ? Math.round(previous.reduce((s, v) => s + v.duration_minutes, 0) / previous.length)
    : 0
  const topSubject = subjectData.length
    ? [...subjectData].sort((a, b) => b.value - a.value)[0].name
    : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#252E3D]">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Last {days} days</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {DAYS_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                days === d
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Total Visits"
          value={totalVisits}
          trend={trendPct(totalVisits, prevVisits)}
        />
        <MetricCard
          label="Avg Session"
          value={avgDuration ? `${avgDuration}m` : '—'}
          trend={trendPct(avgDuration, prevAvgDuration)}
        />
        <MetricCard label="Top Subject" value={topSubject} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{days === 7 ? 'Visits Per Day' : 'Visits Per Week'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!totalVisits ? (
            <p className="text-sm text-slate-400 py-10 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={visitsByPeriod} margin={{ top: 4, right: 8, left: -20, bottom: days === 90 ? 16 : 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  angle={days === 90 ? -35 : 0}
                  textAnchor={days === 90 ? 'end' : 'middle'}
                  height={days === 90 ? 44 : 24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#EFF6FF' }} />
                <Bar dataKey="count" fill="#3D4A5C" radius={[4, 4, 0, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Peak Hours</CardTitle></CardHeader>
        <CardContent>
          {!totalVisits ? (
            <p className="text-sm text-slate-400 py-10 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakHours} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#EEF2FF' }} />
                <Bar dataKey="count" fill="#534AB7" radius={[4, 4, 0, 0]} name="Check-ins" />
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
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Session Duration</CardTitle></CardHeader>
          <CardContent>
            {!totalVisits ? (
              <p className="text-sm text-slate-400 py-10 text-center">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={durationBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#FFFBEB' }} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Check-in Method</CardTitle></CardHeader>
        <CardContent>
          {!methodStats.total ? (
            <p className="text-sm text-slate-400 py-4 text-center">No data yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-700">
                <span>
                  Kiosk — <strong>{methodStats.kiosk}</strong> ({methodStats.kioskPct}%)
                </span>
                <span>
                  Staff — <strong>{methodStats.staff}</strong> ({100 - methodStats.kioskPct}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#3D4A5C] rounded-full transition-all duration-500"
                  style={{ width: `${methodStats.kioskPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Kiosk</span>
                <span>Staff</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
