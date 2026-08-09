'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTimerStatus } from '@/lib/timer'
import { elapsedMinutes, fullName } from '@/lib/utils'
import type { Views } from '@/lib/supabase/types'

/**
 * Watches this staff member's assigned active students and files a
 * session_alerts row the moment a timer crosses into yellow or red.
 * Only runs while a staff page is mounted in a browser tab — there's no
 * server-side watcher, so a student's alert won't fire until some staff
 * tab is open to notice the crossing.
 */
export function useSessionAlertWatcher(
  orgId: string | null,
  staffId: string | null,
  students: Views<'active_students'>[]
) {
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!orgId || !staffId) return
    const org = orgId
    const staff = staffId

    async function check() {
      const supabase = createClient()
      for (const s of students) {
        if (s.assigned_staff_id !== staff) continue
        const status = getTimerStatus(elapsedMinutes(s.checked_in_at), s.subjects_snapshot)
        if (status === 'green') continue

        const key = `${s.id}:${status}`
        if (firedRef.current.has(key)) continue
        firedRef.current.add(key)

        const name = fullName(s.student_first_name, s.student_last_name)
        const message = status === 'red'
          ? `${name}'s session time is up.`
          : `${name}'s session has 10 minutes left.`

        const { error } = await supabase.from('session_alerts').insert({
          org_id: org,
          checkin_id: s.id,
          student_id: s.student_id,
          assigned_staff_id: staff,
          level: status,
          message,
        })
        // A unique-constraint conflict just means another tab already filed
        // this alert — expected in normal multi-tab use, not an error to surface.
        if (error && error.code !== '23505') {
          console.error('session_alerts insert failed:', error)
        }
      }
    }

    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [orgId, staffId, students])
}
