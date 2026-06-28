'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useActiveStudents } from '@/hooks/use-active-students'
import { useActiveStaff } from '@/hooks/use-active-staff'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SearchInput } from '@/components/ui/search-input'
import { Toast } from '@/components/ui/toast'
import { TimerPill } from '@/components/students/timer-pill'
import { SubjectTags } from '@/components/students/subject-tags'
import { TIME_LIMITS, SUBJECTS } from '@/lib/constants'
import { fullName, formatTime } from '@/lib/utils'
import type { Tables, Views } from '@/lib/supabase/types'

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

export default function StaffCheckinPage() {
  const { profile } = useCurrentUser()
  const [staffMember, setStaffMember] = useState<{ id: string; location_id: string; location_ids: string[] | null } | null>(null)
  const locationIds = staffMember ? [staffMember.location_id, ...(staffMember.location_ids ?? [])] : []

  useEffect(() => {
    if (!profile) return
    const supabase = createClient()
    supabase
      .from('staff_members')
      .select('id, location_id, location_ids')
      .eq('profile_id', profile.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setStaffMember(data) })
  }, [profile])

  const { students: activeStudents, loading: loadingActive, refetch } = useActiveStudents(profile?.org_id ?? null, locationIds)
  const { staff: activeStaff } = useActiveStaff(profile?.org_id ?? null, locationIds)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Tables<'students'>[]>([])
  const [searching, setSearching] = useState(false)

  const [checkinStudent, setCheckinStudent] = useState<Tables<'students'> | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'reading' | 'both'>('math')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)

  const [checkoutTarget, setCheckoutTarget] = useState<Views<'active_students'> | null>(null)
  const [sessionNote, setSessionNote] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  const [toast, setToast] = useState<ToastState>(null)

  const searchStudents = useCallback(async (q: string) => {
    if (!profile?.org_id || q.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const supabase = createClient()
    let query = supabase
      .from('students')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('is_active', true)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    if (locationIds.length > 0) query = query.in('location_id', locationIds)
    const { data } = await query.limit(10)
    setSearchResults(data ?? [])
    setSearching(false)
  }, [profile?.org_id, locationIds.join(',')])

  useEffect(() => {
    const t = setTimeout(() => searchStudents(query), 300)
    return () => clearTimeout(t)
  }, [query, searchStudents])

  function openCheckinModal(student: Tables<'students'>) {
    setCheckinStudent(student)
    setSelectedSubject(student.subjects)
    setAssignedStaffId('')
    setQuery('')
    setSearchResults([])
  }

  async function handleCheckin() {
    if (!checkinStudent || !profile) return
    setCheckingIn(true)
    const supabase = createClient()

    const { error } = await supabase.from('student_checkins').insert({
      org_id: profile.org_id,
      student_id: checkinStudent.id,
      location_id: checkinStudent.location_id,
      subjects_snapshot: selectedSubject,
      time_limit_minutes: selectedSubject === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single,
      checkin_method: 'staff',
      assigned_staff_id: assignedStaffId || null,
      checked_in_by_staff_id: staffMember?.id ?? null,
      sms_sent: false,
    })

    if (error) {
      setToast({ message: 'Failed to check in student.', variant: 'red' })
    } else {
      setToast({ message: `${fullName(checkinStudent.first_name, checkinStudent.last_name)} checked in.`, variant: 'green' })
      refetch()
    }
    setCheckinStudent(null)
    setCheckingIn(false)
  }

  async function handleCheckout() {
    if (!checkoutTarget) return
    setCheckingOut(true)
    const supabase = createClient()

    const { data, error } = await supabase.rpc('checkout_student', {
      checkin_id: checkoutTarget.id,
      session_note: sessionNote.trim() || undefined,
    })

    if (error) {
      setToast({ message: 'Failed to check out student.', variant: 'red' })
    } else {
      if (data?.send_sms && data?.parent_phone) {
        fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.parent_phone,
            studentName: data.student_first_name,
            centerName: 'BrightMind',
            checkinId: checkoutTarget.id,
            orgId: checkoutTarget.org_id,
          }),
        })
      }
      setToast({ message: `${fullName(checkoutTarget.student_first_name, checkoutTarget.student_last_name)} checked out.`, variant: 'green' })
      refetch()
    }
    setCheckoutTarget(null)
    setSessionNote('')
    setCheckingOut(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Check In / Out</h1>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      {/* Search to check in */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Check In a Student</h2>
        <div className="relative">
          <SearchInput
            placeholder="Search student by name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query.length >= 2 && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
              {searching ? (
                <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">No students found.</div>
              ) : (
                searchResults.map(s => (
                  <button
                    key={s.id}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                    onClick={() => openCheckinModal(s)}
                  >
                    <span className="font-medium text-gray-900">{fullName(s.first_name, s.last_name)}</span>
                    <span className="text-xs text-gray-400">{SUBJECTS[s.subjects]}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active students */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">Currently Checked In</h2>
      {loadingActive ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">Loading…</div>
      ) : activeStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">No students currently checked in.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {activeStudents.map(s => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{fullName(s.student_first_name, s.student_last_name)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <SubjectTags subjects={s.subjects_snapshot} />
                  {s.assigned_staff_name && (
                    <span className="text-xs text-gray-400">{s.assigned_staff_name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400">{formatTime(s.checked_in_at)}</span>
                <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                <Button variant="outline" size="sm" onClick={() => { setCheckoutTarget(s); setSessionNote('') }}>
                  Check Out
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Check-in modal */}
      <Modal open={!!checkinStudent} onClose={() => setCheckinStudent(null)} title="Check In Student">
        {checkinStudent && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Checking in{' '}
              <span className="font-semibold">{fullName(checkinStudent.first_name, checkinStudent.last_name)}</span>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D65F2]"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value as 'math' | 'reading' | 'both')}
              >
                <option value="math">Math (30 min)</option>
                <option value="reading">Reading (30 min)</option>
                <option value="both">Math + Reading (60 min)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Staff{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D65F2]"
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
              <Button variant="secondary" size="md" onClick={() => setCheckinStudent(null)} disabled={checkingIn}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleCheckin} disabled={checkingIn}>
                {checkingIn ? 'Checking in…' : 'Check In'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout modal */}
      <Modal open={!!checkoutTarget} onClose={() => setCheckoutTarget(null)} title="Check Out Student">
        {checkoutTarget && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Checking out{' '}
              <span className="font-semibold">{fullName(checkoutTarget.student_first_name, checkoutTarget.student_last_name)}</span>
            </p>
            <div className="flex items-center gap-3">
              <TimerPill checkedInAt={checkoutTarget.checked_in_at} subjects={checkoutTarget.subjects_snapshot} />
              <span className="text-sm text-gray-500">since {formatTime(checkoutTarget.checked_in_at)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Note{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D65F2] resize-none"
                rows={3}
                placeholder="How did the session go?"
                value={sessionNote}
                onChange={e => setSessionNote(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" size="md" onClick={() => setCheckoutTarget(null)} disabled={checkingOut}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? 'Checking out…' : 'Check Out'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
