'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveStudents } from '@/hooks/use-active-students'
import { useActiveStaff } from '@/hooks/use-active-staff'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Toast } from '@/components/ui/toast'
import { TimerPill } from '@/components/students/timer-pill'
import { SubjectTags } from '@/components/students/subject-tags'
import { TIME_LIMITS, SUBJECTS } from '@/lib/constants'
import { fullName, formatTime } from '@/lib/utils'
import { Search, Info, X } from 'lucide-react'
import type { Tables, Views } from '@/lib/supabase/types'

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

interface Props {
  orgId: string
  staffMembers: Tables<'staff_members'>[]
  locationIds?: string[]
}

export function OwnerCheckinClient({ orgId, staffMembers, locationIds = [] }: Props) {
  const [tab, setTab] = useState<'students' | 'staff'>('students')
  const { students: activeStudents, loading: loadingStudents, refetch: refetchStudents } = useActiveStudents(orgId, locationIds)
  const { staff: activeStaff, refetch: refetchStaff } = useActiveStaff(orgId, locationIds)
  const [toast, setToast] = useState<ToastState>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Student check-in state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Tables<'students'>[]>([])
  const [searching, setSearching] = useState(false)
  const [checkinStudent, setCheckinStudent] = useState<Tables<'students'> | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'reading' | 'both'>('math')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)

  // Student check-out state
  const [checkoutTarget, setCheckoutTarget] = useState<Views<'active_students'> | null>(null)
  const [sessionNote, setSessionNote] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  // Staff clock-in/out state
  const [staffBusy, setStaffBusy] = useState<string | null>(null)

  const supabase = createClient()

  const searchStudents = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(10)
    setSearchResults(data ?? [])
    setSearching(false)
  }, [orgId, supabase])

  useEffect(() => {
    const t = setTimeout(() => searchStudents(query), 300)
    return () => clearTimeout(t)
  }, [query, searchStudents])

  async function handleStudentCheckin() {
    if (!checkinStudent) return
    setCheckingIn(true)
    const { error } = await supabase.from('student_checkins').insert({
      org_id: orgId,
      student_id: checkinStudent.id,
      location_id: checkinStudent.location_id,
      subjects_snapshot: selectedSubject,
      time_limit_minutes: selectedSubject === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single,
      checkin_method: 'staff',
      assigned_staff_id: assignedStaffId || null,
      sms_sent: false,
    })
    if (error) {
      setToast({ message: 'Failed to check in student.', variant: 'red' })
    } else {
      setToast({ message: `${fullName(checkinStudent.first_name, checkinStudent.last_name)} checked in.`, variant: 'green' })
      refetchStudents()
    }
    setCheckinStudent(null)
    setCheckingIn(false)
  }

  async function handleStudentCheckout() {
    if (!checkoutTarget) return
    setCheckingOut(true)
    const { error } = await supabase.rpc('checkout_student', {
      checkin_id: checkoutTarget.id,
      session_note: sessionNote.trim() || undefined,
    })
    if (error) {
      setToast({ message: 'Failed to check out student.', variant: 'red' })
    } else {
      setToast({ message: `${fullName(checkoutTarget.student_first_name, checkoutTarget.student_last_name)} checked out.`, variant: 'green' })
      refetchStudents()
    }
    setCheckoutTarget(null)
    setSessionNote('')
    setCheckingOut(false)
  }

  async function handleStaffClockin(member: Tables<'staff_members'>) {
    setStaffBusy(member.id)
    const { error } = await supabase.from('staff_checkins').insert({
      org_id: orgId,
      staff_id: member.id,
      location_id: member.location_id,
      checked_out_by_owner: false,
    })
    if (error) {
      setToast({ message: `Failed to clock in ${member.first_name}.`, variant: 'red' })
    } else {
      setToast({ message: `${member.first_name} clocked in.`, variant: 'green' })
      refetchStaff()
    }
    setStaffBusy(null)
  }

  async function handleStaffClockout(staffId: string, checkinId: string, name: string) {
    setStaffBusy(staffId)
    const { error } = await supabase.rpc('checkout_staff', { checkin_id: checkinId, by_owner: true })
    if (error) {
      console.error('checkout_staff error:', error)
      setToast({ message: `Failed to clock out ${name}.`, variant: 'red' })
    } else {
      setToast({ message: `${name} clocked out.`, variant: 'green' })
      refetchStaff()
    }
    setStaffBusy(null)
  }

  function elapsedLabel(checkedInAt: string) {
    const ms = now - new Date(checkedInAt).getTime()
    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const sortedActiveStudents = useMemo(
    () => [...activeStudents].sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()),
    [activeStudents]
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#252E3D] mb-5">Check In / Out</h1>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {(['students', 'staff'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Students tab ── */}
      {tab === 'students' && (
        <div className="space-y-5">
          {/* Search to check in */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Check In a Student</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                className={`w-full pl-9 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D4A5C] ${query ? 'pr-8' : 'pr-4'}`}
                placeholder="Search student by name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setSearchResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={14} />
                </button>
              )}
              {query.length >= 1 && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-md overflow-hidden">
                  {searching ? (
                    <div className="px-4 py-3 text-sm text-slate-400">Searching…</div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">No students found.</div>
                  ) : (
                    searchResults.map(s => (
                      <button
                        key={s.id}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                        onClick={() => { setCheckinStudent(s); setSelectedSubject(s.subjects); setAssignedStaffId(''); setQuery(''); setSearchResults([]) }}
                      >
                        <span className="font-medium text-slate-900">{fullName(s.first_name, s.last_name)}</span>
                        <span className="text-xs text-slate-400">{SUBJECTS[s.subjects]}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active students */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Currently Checked In</h2>
            {loadingStudents ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-400 text-center">Loading…</div>
            ) : activeStudents.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-400 text-center">No students currently checked in.</div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {sortedActiveStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{fullName(s.student_first_name, s.student_last_name)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <SubjectTags subjects={s.subjects_snapshot} />
                        {s.assigned_staff_name && <span className="text-xs text-slate-400">{s.assigned_staff_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">{formatTime(s.checked_in_at)}</span>
                      <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                      <Button variant="outline" size="sm" onClick={() => { setCheckoutTarget(s); setSessionNote('') }}>
                        Check Out
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Staff tab ── */}
      {tab === 'staff' && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">All Staff</h2>
          {staffMembers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-400 text-center">No staff members found.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {staffMembers.map(member => {
                const active = activeStaff.find(s => s.staff_id === member.id)
                const busy = staffBusy === member.id
                return (
                  <div key={member.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{fullName(member.first_name, member.last_name)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{member.role_title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {active ? (
                        <>
                          <span className="text-xs text-slate-400" title={`Since ${formatTime(active.checked_in_at)}`}>
                            {elapsedLabel(active.checked_in_at)}
                          </span>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                            Clocked In
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleStaffClockout(member.id, active.id, member.first_name)}
                          >
                            {busy ? '…' : 'Clock Out'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">
                            Not In
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleStaffClockin(member)}
                          >
                            {busy ? '…' : 'Clock In'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Student check-in modal */}
      <Modal open={!!checkinStudent} onClose={() => setCheckinStudent(null)} title="Check In Student">
        {checkinStudent && (
          <div className="space-y-4">
            <p className="text-slate-700">
              Checking in <span className="font-semibold">{fullName(checkinStudent.first_name, checkinStudent.last_name)}</span>
            </p>
            {checkinStudent.notes && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{checkinStudent.notes}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value as 'math' | 'reading' | 'both')}
              >
                <option value="math">Math (30 min)</option>
                <option value="reading">Reading (30 min)</option>
                <option value="both">Math + Reading (60 min)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assign to Staff <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
                value={assignedStaffId}
                onChange={e => setAssignedStaffId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {activeStaff.map(s => (
                  <option key={s.staff_id} value={s.staff_id}>
                    {fullName(s.staff_first_name, s.staff_last_name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" size="md" onClick={() => setCheckinStudent(null)} disabled={checkingIn}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleStudentCheckin} disabled={checkingIn}>
                {checkingIn ? 'Checking in…' : 'Check In'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Student check-out modal */}
      <Modal open={!!checkoutTarget} onClose={() => setCheckoutTarget(null)} title="Check Out Student">
        {checkoutTarget && (
          <div className="space-y-4">
            <p className="text-slate-700">
              Checking out <span className="font-semibold">{fullName(checkoutTarget.student_first_name, checkoutTarget.student_last_name)}</span>
            </p>
            <div className="flex items-center gap-3">
              <TimerPill checkedInAt={checkoutTarget.checked_in_at} subjects={checkoutTarget.subjects_snapshot} />
              <span className="text-sm text-slate-500">since {formatTime(checkoutTarget.checked_in_at)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Session Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <textarea
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3D4A5C] resize-none ${sessionNote ? 'pr-8' : ''}`}
                  rows={3}
                  placeholder="How did the session go?"
                  value={sessionNote}
                  onChange={e => setSessionNote(e.target.value)}
                />
                {sessionNote && (
                  <button type="button" onClick={() => setSessionNote('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" size="md" onClick={() => setCheckoutTarget(null)} disabled={checkingOut}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleStudentCheckout} disabled={checkingOut}>
                {checkingOut ? 'Checking out…' : 'Check Out'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
