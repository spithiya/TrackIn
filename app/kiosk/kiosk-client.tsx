'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, CheckCircle2, Clock, BookOpen, LogIn, LogOut } from 'lucide-react'
import { TimerPill } from '@/components/students/timer-pill'
import { SubjectTags } from '@/components/students/subject-tags'
import { Button } from '@/components/ui/button'
import { TIME_LIMITS, KIOSK_RESET_DELAY_MS } from '@/lib/constants'
import { formatTime, fullName } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/types'

type Student = Tables<'students'>
type Checkin = Tables<'student_checkins'>

type KioskState =
  | { step: 'idle' }
  | { step: 'searching'; query: string; results: Student[]; loading: boolean }
  | { step: 'loading'; student: Student }
  | { step: 'confirm-checkin'; student: Student }
  | { step: 'confirm-checkout'; student: Student; checkin: Checkin }
  | { step: 'processing' }
  | { step: 'success'; action: 'in' | 'out'; studentName: string }

export function KioskClient() {
  const [state, setState] = useState<KioskState>({ step: 'idle' })
  const [query, setQuery] = useState('')
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setState({ step: 'idle' })
      return
    }

    setState(prev =>
      prev.step === 'searching'
        ? { ...prev, loading: true, query: q }
        : { step: 'searching', query: q, results: [], loading: true }
    )

    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .eq('is_active', true)
        .limit(8)
      setState({ step: 'searching', query: q, results: data ?? [], loading: false })
    }, 300)

    return () => {
      if (searchRef.current) clearTimeout(searchRef.current)
    }
  }, [query, supabase])

  useEffect(() => {
    if (state.step !== 'success') return
    const t = setTimeout(() => {
      setState({ step: 'idle' })
      setQuery('')
    }, KIOSK_RESET_DELAY_MS)
    return () => clearTimeout(t)
  }, [state.step])

  const selectStudent = useCallback(
    async (student: Student) => {
      setState({ step: 'loading', student })
      const { data } = await supabase
        .from('student_checkins')
        .select('*')
        .eq('student_id', student.id)
        .is('checked_out_at', null)
        .limit(1)
        .maybeSingle()

      if (data) {
        setState({ step: 'confirm-checkout', student, checkin: data })
      } else {
        setState({ step: 'confirm-checkin', student })
      }
    },
    [supabase]
  )

  const checkIn = useCallback(
    async (student: Student) => {
      setState({ step: 'processing' })
      const timeLimit = student.subjects === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single
      await supabase.from('student_checkins').insert({
        org_id: student.org_id,
        student_id: student.id,
        location_id: student.location_id,
        subjects_snapshot: student.subjects,
        time_limit_minutes: timeLimit,
        checkin_method: 'kiosk',
      })
      setState({ step: 'success', action: 'in', studentName: student.first_name })
    },
    [supabase]
  )

  const checkOut = useCallback(
    async (checkin: Checkin, student: Student) => {
      setState({ step: 'processing' })
      const { data } = await supabase.rpc('checkout_student', { p_checkin_id: checkin.id, p_session_note: null })
      if (data?.send_sms && data?.parent_phone) {
        fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.parent_phone,
            studentName: data.student_first_name,
            centerName: 'BrightMind',
            checkinId: checkin.id,
            orgId: student.org_id,
          }),
        })
      }
      setState({ step: 'success', action: 'out', studentName: student.first_name })
    },
    [supabase]
  )

  const reset = useCallback(() => {
    setState({ step: 'idle' })
    setQuery('')
  }, [])

  // Loading / processing
  if (state.step === 'loading' || state.step === 'processing') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Just a moment…</p>
        </div>
      </div>
    )
  }

  // Success
  if (state.step === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center">
            <CheckCircle2 size={52} className="text-teal-600" />
          </div>
          <div>
            {state.action === 'in' ? (
              <>
                <h2 className="text-4xl font-bold text-slate-900">You're checked in!</h2>
                <p className="text-slate-500 mt-2 text-lg">
                  Welcome, {state.studentName}. Have a great session!
                </p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-slate-900">See you next time!</h2>
                <p className="text-slate-500 mt-2 text-lg">
                  Great work today, {state.studentName}.
                </p>
              </>
            )}
          </div>
          <p className="text-slate-400 text-sm">Returning to home screen…</p>
        </div>
      </div>
    )
  }

  // Confirm check-in
  if (state.step === 'confirm-checkin') {
    const { student } = state
    const timeLimit = student.subjects === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-6">
          <div>
            <p className="text-slate-500 text-sm mb-1">Checking in</p>
            <h2 className="text-3xl font-bold text-slate-900">
              {fullName(student.first_name, student.last_name)}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <BookOpen size={18} className="text-teal-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Today's subjects</p>
                <SubjectTags subjects={student.subjects} />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Clock size={18} className="text-teal-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Session time</p>
                <p className="text-sm font-medium text-slate-900">{timeLimit} minutes</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button size="xl" onClick={() => checkIn(student)} className="w-full">
              <LogIn size={20} className="mr-2" />
              Check In
            </Button>
            <Button variant="ghost" size="md" onClick={reset} className="w-full text-slate-400 hover:text-slate-600">
              That's not me
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Confirm check-out
  if (state.step === 'confirm-checkout') {
    const { student, checkin } = state
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-6">
          <div>
            <p className="text-slate-500 text-sm mb-1">Checking out</p>
            <h2 className="text-3xl font-bold text-slate-900">
              {fullName(student.first_name, student.last_name)}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Clock size={18} className="text-teal-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Time in session</p>
                <TimerPill
                  checkedInAt={checkin.checked_in_at}
                  subjects={checkin.subjects_snapshot}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <BookOpen size={18} className="text-teal-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Subjects</p>
                <SubjectTags subjects={checkin.subjects_snapshot} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-0.5">Checked in at</p>
              <p className="text-sm font-medium text-slate-900">
                {formatTime(checkin.checked_in_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button size="xl" onClick={() => checkOut(checkin, student)} className="w-full">
              <LogOut size={20} className="mr-2" />
              Check Out
            </Button>
            <Button variant="ghost" size="md" onClick={reset} className="w-full text-slate-400 hover:text-slate-600">
              That's not me
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Idle / searching
  const isSearching = state.step === 'searching'
  const results = isSearching ? state.results : []
  const isLoading = isSearching && state.loading

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {!isSearching && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Welcome!</h2>
            <p className="text-slate-500 text-lg">Type your name to check in or out.</p>
          </div>
        )}

        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your name…"
            className="w-full pl-11 pr-10 py-4 text-lg rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p>
                  No students found for &ldquo;
                  <span className="text-slate-600">{state.query}</span>&rdquo;
                </p>
                <p className="text-sm mt-1">Try a different spelling or ask a staff member.</p>
              </div>
            ) : (
              results.map(student => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-teal-300 hover:shadow-md transition-all text-left group"
                >
                  <div>
                    <p className="text-lg font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {fullName(student.first_name, student.last_name)}
                    </p>
                    <div className="mt-1">
                      <SubjectTags subjects={student.subjects} />
                    </div>
                  </div>
                  <span className="text-slate-300 group-hover:text-teal-400 ml-4 text-xl transition-colors">
                    ›
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
