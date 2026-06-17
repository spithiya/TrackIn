'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import { Download, FileSpreadsheet } from 'lucide-react'

type StaffCheckin = {
  id: string
  staff_id: string
  checked_in_at: string
  checked_out_at: string | null
  duration_minutes: number | null
  location_id: string
  staff_members: { first_name: string; last_name: string; role_title: string | null } | null
}

type Location = { id: string; name: string }
type StaffMember = { id: string; first_name: string; last_name: string }

export function TimesheetsClient({
  orgId,
  locations,
  staffList,
  globalLocationIds = [],
}: {
  orgId: string
  locations: Location[]
  staffList: StaffMember[]
  globalLocationIds?: string[]
}) {
  const [rows, setRows] = useState<StaffCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [staffId, setStaffId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const locationMap = Object.fromEntries(locations.map(l => [l.id, l.name]))

  const loadRows = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('staff_checkins')
      .select('*, staff_members(first_name, last_name, role_title)')
      .eq('org_id', orgId)
      .not('checked_out_at', 'is', null)
      .order('checked_in_at', { ascending: false })
      .limit(100)

    if (staffId) query = query.eq('staff_id', staffId)
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
    setRows((data ?? []) as unknown as StaffCheckin[])
    setLoading(false)
  }, [orgId, staffId, locationId, globalLocationIds.join(','), from, to])

  useEffect(() => { loadRows() }, [loadRows])

  function downloadCsv() {
    if (!rows.length) return
    const headers = ['Staff', 'Role', 'Location', 'Date', 'Clock In', 'Clock Out', 'Duration']
    const data = rows.map(r => {
      const staff = r.staff_members
      return [
        staff ? `${staff.last_name}, ${staff.first_name}` : '—',
        staff?.role_title ?? '—',
        locationMap[r.location_id] ?? '—',
        formatDate(r.checked_in_at),
        formatTime(r.checked_in_at),
        r.checked_out_at ? formatTime(r.checked_out_at) : '—',
        r.duration_minutes ? formatDuration(r.duration_minutes) : '—',
      ]
    })
    const csv = [headers, ...data].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'timesheets.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportSheets() {
    if (!locationId) { alert('Select a location to export to Sheets.'); return }
    setExporting(true)
    // Open a blank tab now (while inside a user gesture) to avoid popup blockers
    const win = window.open('', '_blank')
    try {
      const loc = locations.find(l => l.id === locationId)
      const period = from ? from.slice(0, 7) : new Date().toISOString().slice(0, 7)
      const res = await globalThis.fetch('/api/export/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, locationName: loc?.name, period }),
      })
      const json = await res.json()
      if (json.url) {
        if (win) win.location.href = json.url
        else window.open(json.url, '_blank')
      } else {
        win?.close()
        alert(json.error ?? 'Export failed.')
      }
    } catch (err) {
      win?.close()
      alert('Export failed. Check console for details.')
      console.error('Sheets export error:', err)
    }
    setExporting(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Timesheets</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={downloadCsv} disabled={!rows.length}>
            <Download size={14} className="mr-1.5" />
            CSV
          </Button>
          <Button size="sm" variant="secondary" onClick={exportSheets} disabled={exporting}>
            <FileSpreadsheet size={14} className="mr-1.5" />
            {exporting ? 'Exporting…' : 'Google Sheets'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={staffId}
          onChange={e => setStaffId(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All staff</option>
          {staffList.map(s => (
            <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
          ))}
        </select>
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
        {(staffId || locationId || from || to) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setStaffId(''); setLocationId(''); setFrom(''); setTo('') }}
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
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No timesheet entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Staff</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Clock In</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Clock Out</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const staff = r.staff_members
                    return (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {staff ? `${staff.last_name}, ${staff.first_name}` : '—'}
                          </p>
                          {staff?.role_title && (
                            <p className="text-xs text-slate-400 mt-0.5">{staff.role_title}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{locationMap[r.location_id] ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(r.checked_in_at)}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{formatTime(r.checked_in_at)}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {r.checked_out_at ? formatTime(r.checked_out_at) : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                          {r.duration_minutes ? formatDuration(r.duration_minutes) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <p className="text-xs text-slate-400">{rows.length} entr{rows.length !== 1 ? 'ies' : 'y'}</p>
      )}
    </div>
  )
}
