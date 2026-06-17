'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SubjectTags } from '@/components/students/subject-tags'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import { Download } from 'lucide-react'
import type { Views } from '@/lib/supabase/types'

type Visit = Views<'visit_history'>
type Location = { id: string; name: string }

export function HistoryClient({
  orgId,
  locations,
  globalLocationIds = [],
}: {
  orgId: string
  locations: Location[]
  globalLocationIds?: string[]
}) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [locationId, setLocationId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('visit_history')
      .select('*')
      .eq('org_id', orgId)
      .order('checked_in_at', { ascending: false })
      .limit(100)

    if (locationId) {
      query = query.eq('location_id', locationId)
    } else if (globalLocationIds.length > 0) {
      query = query.in('location_id', globalLocationIds)
    }
    if (from) query = query.gte('checked_in_at', from)
    if (to) {
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      query = query.lt('checked_in_at', toDate.toISOString())
    }

    const { data } = await query
    setVisits(data ?? [])
    setLoading(false)
  }, [orgId, locationId, globalLocationIds.join(','), from, to])

  useEffect(() => { fetch() }, [fetch])

  function exportCsv() {
    const params = new URLSearchParams()
    if (locationId) params.set('locationId', locationId)
    window.open(`/api/export/csv?${params}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Visit History</h1>
        <Button size="sm" variant="secondary" onClick={exportCsv}>
          <Download size={14} className="mr-1.5" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={locationId}
          onChange={e => setLocationId(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All locations</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {(locationId || from || to) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setLocationId(''); setFrom(''); setTo('') }}
            className="text-slate-500"
          >
            Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visits.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No visits found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">In</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Out</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Duration</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Subjects</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map(v => (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {v.student_first_name} {v.student_last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(v.checked_in_at)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatTime(v.checked_in_at)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatTime(v.checked_out_at)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatDuration(v.duration_minutes)}</td>
                      <td className="px-4 py-3"><SubjectTags subjects={v.subjects_snapshot} /></td>
                      <td className="px-4 py-3">
                        <Badge variant={v.checkin_method === 'kiosk' ? 'teal' : 'default'}>
                          {v.checkin_method === 'kiosk' ? 'Kiosk' : 'Staff'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <p className="text-xs text-slate-400">{visits.length} visit{visits.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
