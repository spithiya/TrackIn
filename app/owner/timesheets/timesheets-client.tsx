'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Toast } from '@/components/ui/toast'
import { DateTimeInput } from '@/components/ui/datetime-input'
import { DateInput } from '@/components/ui/date-input'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import { Download, ChevronDown, FileText, FileSpreadsheet, File, Pencil, Plus, Trash2 } from 'lucide-react'

type StaffCheckin = {
  id: string
  staff_id: string
  checked_in_at: string
  checked_out_at: string | null
  duration_minutes: number | null
  location_id: string
  edited_at: string | null
  staff_members: { first_name: string; last_name: string; role_title: string | null } | null
}

type StatsRow = {
  staff_id: string
  duration_minutes: number | null
  staff_members: { first_name: string; last_name: string } | null
}

type Location = { id: string; name: string; opens_at: string; closes_at: string }

// The time picker's dropdown suggestions for a shift at this location are
// limited to an hour before opening through an hour after closing — staff
// aren't realistically clocking in outside that window, and it keeps the
// list short. Typing an exact time still works for the rare exception.
function getTimeWindow(location: Location | undefined): { minTime?: string; maxTime?: string } {
  if (!location) return {}
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
  }
  const clamp = (mins: number) => Math.max(0, Math.min(23 * 60 + 45, mins))
  const format = (mins: number) => {
    const c = clamp(mins)
    return `${String(Math.floor(c / 60)).padStart(2, '0')}:${String(c % 60).padStart(2, '0')}`
  }
  return {
    minTime: format(toMinutes(location.opens_at) - 60),
    maxTime: format(toMinutes(location.closes_at) + 60),
  }
}
type StaffMember = { id: string; first_name: string; last_name: string; location_id: string }

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

export function TimesheetsClient({
  orgId,
  ownerId,
  locations,
  staffList,
  globalLocationIds = [],
}: {
  orgId: string
  ownerId: string
  locations: Location[]
  staffList: StaffMember[]
  globalLocationIds?: string[]
}) {
  const [rows, setRows] = useState<StaffCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [statsRows, setStatsRows] = useState<StatsRow[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [staffId, setStaffId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [toast, setToast] = useState<ToastState>(null)
  const [editRow, setEditRow] = useState<StaffCheckin | null>(null)
  const [editStaffId, setEditStaffId] = useState('')
  const [editLocationId, setEditLocationId] = useState('')
  const [editIn, setEditIn] = useState('')
  const [editOut, setEditOut] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addStaffId, setAddStaffId] = useState('')
  const [addLocationId, setAddLocationId] = useState('')
  const [addIn, setAddIn] = useState('')
  const [addOut, setAddOut] = useState('')
  const [savingAdd, setSavingAdd] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<StaffCheckin | null>(null)
  const [deleting, setDeleting] = useState(false)

  const locationMap = Object.fromEntries(locations.map(l => [l.id, l.name]))
  const staffMap = Object.fromEntries(staffList.map(s => [s.id, s]))

  const editWindow = useMemo(
    () => getTimeWindow(locations.find(l => l.id === editLocationId)),
    [locations, editLocationId]
  )
  const addWindow = useMemo(
    () => getTimeWindow(locations.find(l => l.id === addLocationId)),
    [locations, addLocationId]
  )

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

  // Separate from loadRows (which caps at 100 for table display) so the
  // hours summary below stays accurate no matter how many entries match
  // the current filters.
  const loadStats = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from('staff_checkins')
      .select('staff_id, duration_minutes, staff_members(first_name, last_name)')
      .eq('org_id', orgId)
      .not('duration_minutes', 'is', null)

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
    setStatsRows((data ?? []) as unknown as StatsRow[])
  }, [orgId, staffId, locationId, globalLocationIds.join(','), from, to])

  useEffect(() => { loadStats() }, [loadStats])

  const stats = useMemo(() => {
    let totalMinutes = 0
    const byStaff = new Map<string, { name: string; minutes: number }>()
    for (const r of statsRows) {
      if (r.duration_minutes == null) continue
      totalMinutes += r.duration_minutes
      const existing = byStaff.get(r.staff_id)
      if (existing) {
        existing.minutes += r.duration_minutes
      } else {
        byStaff.set(r.staff_id, {
          name: r.staff_members ? `${r.staff_members.last_name}, ${r.staff_members.first_name}` : 'Unknown',
          minutes: r.duration_minutes,
        })
      }
    }
    const perStaff = Array.from(byStaff.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.minutes - a.minutes)
    return { totalMinutes, perStaff }
  }, [statsRows])

  function openEdit(row: StaffCheckin) {
    setEditRow(row)
    setEditStaffId(row.staff_id)
    setEditLocationId(row.location_id)
    setEditIn(toDatetimeLocal(row.checked_in_at))
    setEditOut(toDatetimeLocal(row.checked_out_at))
  }

  async function handleSaveEdit() {
    if (!editRow || !editIn || !editStaffId || !editLocationId) return
    const checkedInAt = fromDatetimeLocal(editIn)!
    const checkedOutAt = fromDatetimeLocal(editOut)
    if (checkedOutAt && checkedOutAt <= checkedInAt) {
      setToast({ message: 'Clock out must be after clock in.', variant: 'red' })
      return
    }
    setSavingEdit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('staff_checkins')
      .update({
        staff_id: editStaffId,
        location_id: editLocationId,
        checked_in_at: checkedInAt,
        checked_out_at: checkedOutAt,
        edited_at: new Date().toISOString(),
        edited_by: ownerId,
      })
      .eq('id', editRow.id)
    if (error) {
      setToast({ message: 'Failed to update entry.', variant: 'red' })
    } else {
      setToast({ message: 'Timesheet entry updated.', variant: 'green' })
      setEditRow(null)
      loadRows()
      loadStats()
    }
    setSavingEdit(false)
  }

  async function handleDeleteEntry() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('staff_checkins').delete().eq('id', deleteTarget.id)
    if (error) {
      setToast({ message: 'Failed to delete entry.', variant: 'red' })
    } else {
      setToast({ message: 'Timesheet entry deleted.', variant: 'green' })
      setDeleteTarget(null)
      loadRows()
      loadStats()
    }
    setDeleting(false)
  }

  function openAdd() {
    setAddStaffId('')
    setAddLocationId('')
    setAddIn('')
    setAddOut('')
    setAddOpen(true)
  }

  async function handleSaveAdd() {
    if (!addStaffId || !addLocationId || !addIn) return
    const checkedInAt = fromDatetimeLocal(addIn)!
    const checkedOutAt = fromDatetimeLocal(addOut)
    if (checkedOutAt && checkedOutAt <= checkedInAt) {
      setToast({ message: 'Clock out must be after clock in.', variant: 'red' })
      return
    }
    setSavingAdd(true)
    const supabase = createClient()
    const { error } = await supabase.from('staff_checkins').insert({
      org_id: orgId,
      staff_id: addStaffId,
      location_id: addLocationId,
      checked_in_at: checkedInAt,
      checked_out_at: checkedOutAt,
      checked_out_by_owner: !!checkedOutAt,
      edited_at: new Date().toISOString(),
      edited_by: ownerId,
    })
    if (error) {
      setToast({ message: 'Failed to add entry.', variant: 'red' })
    } else {
      setToast({ message: 'Timesheet entry added.', variant: 'green' })
      setAddOpen(false)
      loadRows()
      loadStats()
    }
    setSavingAdd(false)
  }

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
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Timesheets')
    ws.addRow(headers)
    body.forEach(row => ws.addRow(row))
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'timesheets.xlsx'
    a.click()
    URL.revokeObjectURL(url)
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
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#252E3D]">Timesheets</h1>

        <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={openAdd}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add Entry
        </Button>
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
          <DateInput value={from} onChange={setFrom} className="w-36" />
          <span className="text-slate-400 text-sm">to</span>
          <DateInput value={to} onChange={setTo} className="w-36" />
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

      {stats.totalMinutes > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-start gap-8">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Total Hours{from || to ? ' (Filtered)' : ''}
                </p>
                <p className="text-2xl font-semibold text-[#252E3D] font-mono">{formatDuration(stats.totalMinutes)}</p>
              </div>
              {!staffId && stats.perStaff.length > 0 && (
                <div className="flex-1 min-w-[240px]">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">By Staff</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.perStaff.map(s => (
                      <div key={s.id} className="flex items-center gap-1.5 text-sm bg-[#ECEEF1] rounded-lg px-3 py-1.5">
                        <span className="text-slate-600">{s.name}</span>
                        <span className="font-mono font-medium text-slate-900">{formatDuration(s.minutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                    <th className="px-4 py-3" />
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
                          {r.checked_out_at ? (
                            formatTime(r.checked_out_at)
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-green-100 text-green-800 text-xs font-sans font-medium">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                          {r.duration_minutes ? formatDuration(r.duration_minutes) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {r.edited_at && (
                            <span title={`Edited by owner · ${formatDate(r.edited_at)} ${formatTime(r.edited_at)}`} className="text-xs text-slate-400 mr-2">
                              Edited
                            </span>
                          )}
                          <button
                            onClick={() => openEdit(r)}
                            className="text-slate-400 hover:text-[#3D4A5C] transition-colors mr-3"
                            aria-label="Edit entry"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                            aria-label="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
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

      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Timesheet Entry">
        {editRow && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Staff</label>
              <select
                value={editStaffId}
                onChange={e => setEditStaffId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
              >
                {/* staffList only has active staff — if this entry belongs to
                    someone since deactivated/removed, keep them selectable so
                    saving without touching this field doesn't silently
                    reassign the entry to whoever the first option happens to be. */}
                {!staffMap[editRow.staff_id] && editRow.staff_members && (
                  <option value={editRow.staff_id}>
                    {editRow.staff_members.last_name}, {editRow.staff_members.first_name} (inactive)
                  </option>
                )}
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
              <select
                value={editLocationId}
                onChange={e => setEditLocationId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Clock In</label>
              <DateTimeInput value={editIn} onChange={setEditIn} minTime={editWindow.minTime} maxTime={editWindow.maxTime} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Clock Out</label>
              <DateTimeInput value={editOut} onChange={setEditOut} minTime={editWindow.minTime} maxTime={editWindow.maxTime} />
              <p className="text-xs text-slate-400 mt-1">Leave blank if still clocked in.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setEditRow(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit || !editIn}>
                {savingEdit ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Timesheet Entry">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Staff</label>
            <select
              value={addStaffId}
              onChange={e => {
                setAddStaffId(e.target.value)
                const member = staffMap[e.target.value]
                if (member) setAddLocationId(member.location_id)
              }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
            >
              <option value="">Select staff…</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
            <select
              value={addLocationId}
              onChange={e => setAddLocationId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
            >
              <option value="">Select location…</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Clock In</label>
            <DateTimeInput value={addIn} onChange={setAddIn} minTime={addWindow.minTime} maxTime={addWindow.maxTime} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Clock Out</label>
            <DateTimeInput value={addOut} onChange={setAddOut} minTime={addWindow.minTime} maxTime={addWindow.maxTime} />
            <p className="text-xs text-slate-400 mt-1">Leave blank to add an active (still clocked in) shift.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSaveAdd}
              disabled={savingAdd || !addStaffId || !addLocationId || !addIn}
            >
              {savingAdd ? 'Adding…' : 'Add Entry'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Timesheet Entry">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Delete this entry for{' '}
              <span className="font-medium text-slate-900">
                {deleteTarget.staff_members
                  ? `${deleteTarget.staff_members.first_name} ${deleteTarget.staff_members.last_name}`
                  : 'this staff member'}
              </span>{' '}
              on {formatDate(deleteTarget.checked_in_at)}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDeleteEntry} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Entry'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
