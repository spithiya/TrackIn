'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/types'

export default function StaffMyTimesheetPage() {
  const { profile, loading: loadingProfile } = useCurrentUser()
  const [sessions, setSessions] = useState<Tables<'staff_checkins'>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const supabase = createClient()

    const { data: member } = await supabase
      .from('staff_members')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (!member) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('staff_checkins')
      .select('*')
      .eq('staff_id', member.id)
      .not('checked_out_at', 'is', null)
      .order('checked_in_at', { ascending: false })
      .limit(50)

    setSessions(data ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => {
    if (profile) fetchSessions()
  }, [profile, fetchSessions])

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Timesheet</h1>

      {loadingProfile || loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 text-center">Loading…</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 text-center">No completed sessions yet.</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Clock In</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Clock Out</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900">{formatDate(s.checked_in_at)}</td>
                    <td className="px-5 py-3 text-gray-700">{formatTime(s.checked_in_at)}</td>
                    <td className="px-5 py-3 text-gray-700">
                      {s.checked_out_at ? formatTime(s.checked_out_at) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900">
                      {s.duration_minutes != null ? formatDuration(s.duration_minutes) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalMinutes > 0 && (
            <p className="text-sm text-gray-500 text-right pr-1">
              Total ({sessions.length} sessions):{' '}
              <span className="font-semibold text-gray-900">{formatDuration(totalMinutes)}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
