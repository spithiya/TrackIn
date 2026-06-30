'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import { Download, ChevronDown, FileText, FileSpreadsheet, File } from 'lucide-react'

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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [staffId, setStaffId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const locationMap = Object.fromEntries(locations.map(l => [l.id, l.name]))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  function getTableData() {
    const headers = ['Staff', 'Role', 'Location', 'Date', 'Clock In', 'Clock Out', 'Duration']
    const body = rows.map(r => {
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
    return { headers, body }
  }

  function downloadCsv() {
    if (!rows.length) return
    const { headers, body } = getTableData()
    const csv = [headers, ...body].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'timesheets.csv'
    a.click()
    URL.revokeObjectURL(url)
    setDropdownOpen(false)
  }

  async function downloadExcel() {
    if (!rows.length) return
    const { headers, body } = getTableData()
    const { utils, writeFile } = await import('xlsx')
    const ws = utils.aoa_to_sheet([headers, ...body])
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Timesheets')
    writeFile(wb, 'timesheets.xlsx')
    setDropdownOpen(false)
  }

  async function downloadPdf() {
    if (!rows.length) return
    const { headers, body } = getTableData()
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('Timesheets', 14, 15)
    autoTable(doc, {
      head: [headers],
      body,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] },
    })
    doc.save('timesheets.pdf')
    setDropdownOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#252E3D]">Timesheets</h1>

        <div className="relative" ref={dropdownRef}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDropdownOpen(o => !o)}
            disabled={!rows.length}
            className="flex items-center gap-1.5"
          >
            <Download size={14} />
            Download
            <ChevronDown size={13} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={downloadCsv}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-[#F1F2F5] transition-colors"
              >
                <FileText size={14} className="text-slate-400" />
                CSV
              </button>
              <button
                onClick={downloadExcel}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-[#F1F2F5] transition-colors"
              >
                <FileSpreadsheet size={14} className="text-green-600" />
                Excel (.xlsx)
              </button>
              <button
                onClick={downloadPdf}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-[#F1F2F5] transition-colors"
              >
                <File size={14} className="text-red-500" />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={staffId}
          onChange={e => setStaffId(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
        >
          <option value="">All staff</option>
          {staffList.map(s => (
            <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
          ))}
        </select>
        <select
          value={locationId}
          onChange={e => setLocationId(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
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
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
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
              <div className="w-6 h-6 border-2 border-[#3D4A5C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No timesheet entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#ECEEF1]">
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Staff</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Clock In</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Clock Out</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const staff = r.staff_members
                    return (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-[#F1F2F5] transition-colors">
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
