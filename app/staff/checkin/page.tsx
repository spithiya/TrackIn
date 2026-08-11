'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useActiveStudents } from '@/hooks/use-active-students'
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

  // Don't fetch until staffMember has resolved — otherwise the first fetch
  // goes out unfiltered (assignedStaffId still undefined) and can race with
  // the correctly-filtered one that follows once staffMember loads.
  const { students: activeStudents, loading: loadingActive, refetch } = useActiveStudents(
    staffMember ? (profile?.org_id ?? null) : null,
    locationIds,
    staffMember?.id
  )

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Tables<'students'>[]>([])
  const [searching, setSearching] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [defaultStudents, setDefaultStudents] = useState<Tables<'students'>[]>([])
  const [loadingDefault, setLoadingDefault] = useState(false)

  const [checkinTarget, setCheckinTarget] = useState<Tables<'students'> | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)

  const [checkoutTarget, setCheckoutTarget] = useState<Views<'active_students'> | null>(null)
  const [sessionNote, setSessionNote] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  const [toast, setToast] = useState<ToastState>(null)

  const searchStudents = useCallback(async (q: string) => {
    if (!profile?.org_id || q.trim().length < 1) { setSearchResults([]); return }
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

  useEffect(() => {
    if (!profile?.org_id) return
    let cancelled = false
    async function loadDefaultStudents() {
      setLoadingDefault(true)
      const supabase = createClient()
      let q = supabase
        .from('students')
        .select('*')
        .eq('org_id', profile!.org_id)
        .eq('is_active', true)
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true })
      if (locationIds.length > 0) q = q.in('location_id', locationIds)
      const { data } = await q.limit(9)
      if (!cancelled) setDefaultStudents(data ?? [])
      setLoadingDefault(false)
    }
    loadDefaultStudents()
    return () => { cancelled = true }
  }, [profile?.org_id, locationIds.join(',')])

  function openCheckinConfirm(student: Tables<'students'>) {
    setCheckinTarget(student)
    setQuery('')
    setSearchResults([])
    setSearchFocused(false)
  }

  async function handleConfirmCheckin() {
    if (!profile || !staffMember || !checkinTarget) return
    setCheckingIn(true)
    const supabase = createClient()
    const { error } = await supabase.from('student_checkins').insert({
      org_id: profile.org_id,
      student_id: checkinTarget.id,
      location_id: checkinTarget.location_id,
      subjects_snapshot: checkinTarget.subjects,
      time_limit_minutes: checkinTarget.subjects === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single,
      checkin_method: 'staff',
      assigned_staff_id: staffMember.id,
      checked_in_by_staff_id: staffMember.id,
      sms_sent: false,
    })
    if (error) {
      setToast({ message: 'Failed to check in student.', variant: 'red' })
    } else {
      setToast({ message: `${fullName(checkinTarget.first_name, checkinTarget.last_name)} checked in.`, variant: 'green' })
      refetch()
    }
    setCheckinTarget(null)
    setCheckingIn(false)
  }

  async function handleCheckout() {
    if (!checkoutTarget) return
    setCheckingOut(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('checkout_student', {
      checkin_id: checkoutTarget.id,
      session_note: sessionNote.trim() || undefined,
    })
    if (error) {
      setToast({ message: 'Failed to check out student.', variant: 'red' })
    } else {
      setToast({ message: `${fullName(checkoutTarget.student_first_name, checkoutTarget.student_last_name)} checked out.`, variant: 'green' })
      refetch()
    }
    setCheckoutTarget(null)
    setSessionNote('')
    setCheckingOut(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0F2040] mb-6">Check In / Out</h1>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      {/* Search to check in */}
      <div className="bg-white rounded-xl border border-[#BECDE8] border-t-[3px] border-t-[#1B3A6B] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#0F2040] uppercase tracking-wider mb-3">Check In a Student</h2>
        <div className="relative">
          <SearchInput
            placeholder="Search student by name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
          />
          {(query.length >= 1 || searchFocused) && (() => {
            const isDefaultList = query.trim().length < 1
            const list = isDefaultList ? defaultStudents : searchResults
            const isLoading = isDefaultList ? loadingDefault : searching
            return (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-[#BECDE8] shadow-md overflow-hidden">
                {isLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-400">{isDefaultList ? 'Loading…' : 'Searching…'}</div>
                ) : list.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">
                    {isDefaultList ? 'No students enrolled yet.' : 'No students found.'}
                  </div>
                ) : (
                  <>
                    {isDefaultList && (
                      <div className="px-4 py-2 text-xs font-medium text-gray-400 bg-[#F4F7FF] border-b border-[#E8EDF7]">
                        All students (A–Z)
                      </div>
                    )}
                    {list.map(s => (
                      <button
                        key={s.id}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[#F0F4FA] flex items-center justify-between border-b border-[#E8EDF7] last:border-0 transition-colors"
                        onClick={() => openCheckinConfirm(s)}
                      >
                        <span className="font-medium text-gray-900">{fullName(s.first_name, s.last_name)}</span>
                        <span className="text-xs text-gray-400">{SUBJECTS[s.subjects]}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Active students */}
      <h2 className="text-sm font-semibold text-[#0F2040] uppercase tracking-wider mb-3">Currently Checked In</h2>
      {loadingActive ? (
        <div className="bg-white rounded-xl border border-[#BECDE8] p-6 text-sm text-gray-400 text-center">Loading…</div>
      ) : activeStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#BECDE8] p-6 text-sm text-gray-400 text-center">No students currently checked in.</div>
      ) : (
        <div className="bg-white rounded-xl border border-[#BECDE8] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] px-5 py-2.5 bg-[#E8EDF7] border-b border-[#BECDE8]">
            <span className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Student</span>
            <span className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Actions</span>
          </div>
          <div className="divide-y divide-[#E8EDF7]">
            {activeStudents.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-4 hover:bg-[#F0F4FA] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{fullName(s.student_first_name, s.student_last_name)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SubjectTags subjects={s.subjects_snapshot} />
                    {s.assigned_staff_name && (
                      <span className="text-xs text-gray-400">{s.assigned_staff_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{formatTime(s.checked_in_at)}</span>
                  <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setCheckoutTarget(s); setSessionNote('') }}
                    className="border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#E8EDF7]"
                  >
                    Check Out
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in confirmation modal */}
      <Modal open={!!checkinTarget} onClose={() => setCheckinTarget(null)} title="Check In Student">
        {checkinTarget && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Check in{' '}
              <span className="font-semibold text-[#0F2040]">{fullName(checkinTarget.first_name, checkinTarget.last_name)}</span>?
            </p>
            <SubjectTags subjects={checkinTarget.subjects} />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" size="md" onClick={() => setCheckinTarget(null)} disabled={checkingIn}>Cancel</Button>
              <Button size="md" onClick={handleConfirmCheckin} disabled={checkingIn} className="bg-[#1B3A6B] hover:bg-[#122F5E] focus-visible:ring-[#1B3A6B]">
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
              <span className="font-semibold text-[#0F2040]">{fullName(checkoutTarget.student_first_name, checkoutTarget.student_last_name)}</span>
            </p>
            <div className="flex items-center gap-3">
              <TimerPill checkedInAt={checkoutTarget.checked_in_at} subjects={checkoutTarget.subjects_snapshot} />
              <span className="text-sm text-gray-500">since {formatTime(checkoutTarget.checked_in_at)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
                rows={3}
                placeholder="How did the session go?"
                value={sessionNote}
                onChange={e => setSessionNote(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" size="md" onClick={() => setCheckoutTarget(null)} disabled={checkingOut}>Cancel</Button>
              <Button size="md" onClick={handleCheckout} disabled={checkingOut} className="bg-[#1B3A6B] hover:bg-[#122F5E] focus-visible:ring-[#1B3A6B]">
                {checkingOut ? 'Checking out…' : 'Check Out'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
