'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateInput } from '@/components/ui/date-input'
import { SubjectTags } from '@/components/students/subject-tags'
import { Badge } from '@/components/ui/badge'
import { formatTime, formatDuration } from '@/lib/utils'
import { Download, Search, X } from 'lucide-react'
import type { Views } from '@/lib/supabase/types'

type Visit = Views<'visit_history'>
type StudentOption = { id: string; first_name: string; last_name: string }

// Visit History's own date format — includes the day of the week, unlike
// the shared formatDate() used elsewhere (timesheets, dashboard, etc.).
function formatDateWithWeekday(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HistoryClient({
  orgId,
}: {
  orgId: string
}) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null)
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState<StudentOption[]>([])
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [studentFocused, setStudentFocused] = useState(false)

  const searchStudents = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setStudentResults([]); return }
    setSearchingStudents(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('org_id', orgId)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .order('first_name')
      .limit(10)
    setStudentResults(data ?? [])
    setSearchingStudents(false)
  }, [orgId])

  useEffect(() => {
    const t = setTimeout(() => searchStudents(studentQuery), 300)
    return () => clearTimeout(t)
  }, [studentQuery, searchStudents])

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('visit_history')
      .select('*')
      .eq('org_id', orgId)
      .order('checked_in_at', { ascending: false })
      .limit(100)

    if (selectedStudent) query = query.eq('student_id', selectedStudent.id)
    if (from) query = query.gte('checked_in_at', from)
    if (to) {
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      query = query.lt('checked_in_at', toDate.toISOString())
    }

    const { data } = await query
    setVisits(data ?? [])
    setLoading(false)
  }, [orgId, selectedStudent, from, to])

  useEffect(() => { fetch() }, [fetch])

  function exportCsv() {
    const params = new URLSearchParams()
    if (selectedStudent) params.set('studentId', selectedStudent.id)
    window.open(`/api/export/csv?${params}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#252E3D]">Visit History</h1>
        <Button size="sm" variant="secondary" onClick={exportCsv}>
          <Download size={14} className="mr-1.5" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {selectedStudent ? (
          <span className="flex items-center gap-1.5 text-sm bg-[#ECEEF1] border border-slate-200 rounded-lg pl-3 pr-2 py-2 text-slate-700 font-medium">
            {selectedStudent.first_name} {selectedStudent.last_name}
            <button
              type="button"
              onClick={() => { setSelectedStudent(null); setStudentQuery('') }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear student filter"
            >
              <X size={14} />
            </button>
          </span>
        ) : (
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
              placeholder="Filter by student…"
              value={studentQuery}
              onChange={e => setStudentQuery(e.target.value)}
              onFocus={() => setStudentFocused(true)}
              onBlur={() => setTimeout(() => setStudentFocused(false), 150)}
            />
            {studentFocused && studentQuery.trim().length >= 1 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-md overflow-hidden">
                {searchingStudents ? (
                  <div className="px-4 py-3 text-sm text-slate-400">Searching…</div>
                ) : studentResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-400">No students found.</div>
                ) : (
                  studentResults.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      onClick={() => { setSelectedStudent(s); setStudentQuery(''); setStudentResults([]) }}
                    >
                      <span className="font-medium text-slate-900">{s.first_name} {s.last_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <DateInput value={from} onChange={setFrom} className="w-36" />
          <span className="text-slate-400 text-sm">to</span>
          <DateInput value={to} onChange={setTo} className="w-36" />
        </div>
        {(from || to || selectedStudent) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setFrom(''); setTo(''); setSelectedStudent(null); setStudentQuery('') }}
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
          ) : visits.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No visits found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#ECEEF1]">
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">In</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Out</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Duration</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Subjects</th>
                    <th className="text-left px-4 py-3 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map(v => (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-[#F1F2F5] transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {v.student_first_name} {v.student_last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDateWithWeekday(v.checked_in_at)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatTime(v.checked_in_at)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatTime(v.checked_out_at)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatDuration(v.duration_minutes)}</td>
                      <td className="px-4 py-3"><SubjectTags subjects={v.subjects_snapshot} /></td>
                      <td className="px-4 py-3">
                        <Badge variant={v.checkin_method === 'kiosk' ? 'blue' : 'default'}>
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
