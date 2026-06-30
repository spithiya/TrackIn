'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, CheckCircle2, Clock, BookOpen, LogIn, LogOut, MapPin, ArrowUp } from 'lucide-react'
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
  | { step: 'loading'; student: Student }
  | { step: 'confirm-checkin'; student: Student }
  | { step: 'confirm-checkout'; student: Student; checkin: Checkin }
  | { step: 'processing' }
  | { step: 'success'; action: 'in' | 'out'; studentName: string }

export function KioskClient({
  locationId,
  locationName,
  initialStudents,
}: {
  locationId: string
  locationName: string
  initialStudents: Student[]
}) {
  const [state, setState] = useState<KioskState>({ step: 'idle' })
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [allStudents] = useState<Student[]>(initialStudents)
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set())
  const supabase = useMemo(() => createClient(), [])
  const listRef = useRef<HTMLDivElement>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const refreshCheckedIn = useCallback(async () => {
    const { data } = await supabase
      .from('student_checkins')
      .select('student_id')
      .is('checked_out_at', null)
    setCheckedInIds(new Set((data ?? []).map(r => r.student_id)))
  }, [supabase])

  useEffect(() => {
    refreshCheckedIn()
    const interval = setInterval(refreshCheckedIn, 30_000)
    return () => clearInterval(interval)
  }, [refreshCheckedIn])

  const displayedStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allStudents
    return allStudents.filter(
      s =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q)
    )
  }, [query, allStudents])

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

      setState(data
        ? { step: 'confirm-checkout', student, checkin: data }
        : { step: 'confirm-checkin', student }
      )
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
        location_id: locationId,
        subjects_snapshot: student.subjects,
        time_limit_minutes: timeLimit,
        checkin_method: 'kiosk',
      })
      refreshCheckedIn()
      setState({ step: 'success', action: 'in', studentName: student.first_name })
    },
    [supabase, locationId, refreshCheckedIn]
  )

  const checkOut = useCallback(
    async (checkin: Checkin, student: Student) => {
      setState({ step: 'processing' })
      const { data } = await supabase.rpc('checkout_student', { checkin_id: checkin.id })
      refreshCheckedIn()
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
    [supabase, refreshCheckedIn]
  )

  const reset = useCallback(() => {
    setState({ step: 'idle' })
    setQuery('')
    setFocused(false)
  }, [])

  useEffect(() => {
    if (state.step !== 'confirm-checkin' && state.step !== 'confirm-checkout') return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (state.step === 'confirm-checkin') checkIn(state.student)
      else if (state.step === 'confirm-checkout') checkOut(state.checkin, state.student)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state, checkIn, checkOut])

  // ── Loading / processing ──
  if (state.step === 'loading' || state.step === 'processing') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9A8F7E] text-sm">Just a moment…</p>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (state.step === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 rounded-full bg-[#FBF8F0] flex items-center justify-center">
            <CheckCircle2 size={52} className="text-[#C9A96E]" />
          </div>
          <div>
            {state.action === 'in' ? (
              <>
                <h2 className="text-4xl font-bold text-[#1a1209]">You&apos;re checked in!</h2>
                <p className="text-[#9A8F7E] mt-2 text-lg">Welcome, {state.studentName}. Have a great session!</p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-[#1a1209]">See you next time!</h2>
                <p className="text-[#9A8F7E] mt-2 text-lg">Great work today, {state.studentName}.</p>
              </>
            )}
          </div>
          <p className="text-[#9A8F7E]/60 text-sm">Returning to home screen…</p>
        </div>
      </div>
    )
  }

  // ── Confirm check-in ──
  if (state.step === 'confirm-checkin') {
    const { student } = state
    const timeLimit = student.subjects === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-t-[3px] border-gray-100 border-t-[#C9A96E] p-8 flex flex-col gap-6">
          <div>
            <p className="text-[#9A8F7E] text-sm mb-1">Checking in</p>
            <h2 className="text-3xl font-bold text-[#1a1209]">{fullName(student.first_name, student.last_name)}</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-[#FBF8F0] rounded-xl">
              <BookOpen size={18} className="text-[#C9A96E] shrink-0" />
              <div>
                <p className="text-xs text-[#9A8F7E] mb-1">Today&apos;s subjects</p>
                <SubjectTags subjects={student.subjects} />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#FBF8F0] rounded-xl">
              <Clock size={18} className="text-[#C9A96E] shrink-0" />
              <div>
                <p className="text-xs text-[#9A8F7E] mb-0.5">Session time</p>
                <p className="text-sm font-medium text-[#1a1209]">{timeLimit} minutes</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              size="xl"
              onClick={() => checkIn(student)}
              className="w-full bg-[#C9A96E] hover:bg-[#B39258] focus-visible:ring-[#C9A96E]"
            >
              <LogIn size={20} className="mr-2" /> Check In
            </Button>
            <Button variant="ghost" size="md" onClick={reset} className="w-full text-[#9A8F7E] hover:text-[#1a1209]">
              That&apos;s not me
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Confirm check-out ──
  if (state.step === 'confirm-checkout') {
    const { student, checkin } = state
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-t-[3px] border-gray-100 border-t-[#C9A96E] p-8 flex flex-col gap-6">
          <div>
            <p className="text-[#9A8F7E] text-sm mb-1">Checking out</p>
            <h2 className="text-3xl font-bold text-[#1a1209]">{fullName(student.first_name, student.last_name)}</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-[#FBF8F0] rounded-xl">
              <Clock size={18} className="text-[#C9A96E] shrink-0" />
              <div>
                <p className="text-xs text-[#9A8F7E] mb-1">Time in session</p>
                <TimerPill checkedInAt={checkin.checked_in_at} subjects={checkin.subjects_snapshot} />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#FBF8F0] rounded-xl">
              <BookOpen size={18} className="text-[#C9A96E] shrink-0" />
              <div>
                <p className="text-xs text-[#9A8F7E] mb-1">Subjects</p>
                <SubjectTags subjects={checkin.subjects_snapshot} />
              </div>
            </div>
            <div className="p-4 bg-[#FBF8F0] rounded-xl">
              <p className="text-xs text-[#9A8F7E] mb-0.5">Checked in at</p>
              <p className="text-sm font-medium text-[#1a1209]">{formatTime(checkin.checked_in_at)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              size="xl"
              onClick={() => checkOut(checkin, student)}
              className="w-full bg-[#C9A96E] hover:bg-[#B39258] focus-visible:ring-[#C9A96E]"
            >
              <LogOut size={20} className="mr-2" /> Check Out
            </Button>
            <Button variant="ghost" size="md" onClick={reset} className="w-full text-[#9A8F7E] hover:text-[#1a1209]">
              That&apos;s not me
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Idle / search ──
  return (
    <div className={`flex-1 flex flex-col items-center p-8 ${focused ? 'pt-8' : 'justify-center'}`}>
      <div className="w-full max-w-sm flex flex-col gap-4">

        {!focused && (
          <div className="text-center mb-2">
            {locationName && (
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7A5C30] bg-[#FBF8F0] border border-[#D4BC8A]/40 px-3 py-1 rounded-full mb-4">
                <MapPin size={13} />
                {locationName}
              </div>
            )}
            <h2 className="text-4xl font-bold text-[#1a1209] mb-2">Welcome!</h2>
            <p className="text-[#9A8F7E] text-lg">Type your name to check in or out.</p>
          </div>
        )}

        {focused && (
          <p className="text-base font-semibold text-[#1a1209]">
            {query.trim()
              ? `${displayedStudents.length} result${displayedStudents.length !== 1 ? 's' : ''} for "${query.trim()}"`
              : `All students · ${allStudents.length}`}
          </p>
        )}

        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8F7E] pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search your name…"
            className="w-full pl-11 pr-10 py-4 text-lg rounded-xl border border-gray-200 bg-white text-[#1a1209] placeholder:text-[#9A8F7E] focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A8F7E] hover:text-[#1a1209] transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Student list */}
        {focused && (
          <div
            ref={listRef}
            onScroll={e => setShowBackToTop(e.currentTarget.scrollTop > 100)}
            className="overflow-y-auto max-h-[calc(100vh-260px)] flex flex-col gap-1 pr-0.5"
          >
            {displayedStudents.length === 0 ? (
              <div className="text-center py-10 text-[#9A8F7E]">
                <p>No students found for &ldquo;<span className="text-[#1a1209]">{query}</span>&rdquo;</p>
                <p className="text-sm mt-1">Try a different spelling or ask a staff member.</p>
              </div>
            ) : (
              displayedStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-[#C9A96E] hover:bg-[#FBF8F0] transition-all text-left group"
                >
                  <div>
                    <p className="text-base font-semibold text-[#1a1209] group-hover:text-[#7A5C30] transition-colors">
                      {fullName(student.first_name, student.last_name)}
                    </p>
                    <div className="mt-0.5">
                      <SubjectTags subjects={student.subjects} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {checkedInIds.has(student.id) ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        In
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        Out
                      </span>
                    )}
                    <span className="text-gray-300 group-hover:text-[#C9A96E] text-xl transition-colors">›</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {showBackToTop && (
          <button
            onClick={() => listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="self-center flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#D4BC8A]/40 shadow-sm text-sm text-[#7A5C30] hover:bg-[#FBF8F0] transition-colors"
          >
            <ArrowUp size={14} />
            Top
          </button>
        )}
      </div>
    </div>
  )
}
