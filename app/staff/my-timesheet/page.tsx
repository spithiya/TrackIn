'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/types'

export default function StaffMyTimesheetPage() {
  const { profile, loading: loadingProfile } = useCurrentUser()
  const [sessions, setSessions] = useState<Tables<'staff_checkins'>[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchSessions = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const supabase = createClient()
    const { data: member } = await supabase
      .from('staff_members').select('id').eq('profile_id', profile.id).maybeSingle()
    if (!member) { setLoading(false); return }
    let query = supabase
      .from('staff_checkins')
      .select('*')
      .eq('staff_id', member.id)
      .not('checked_out_at', 'is', null)
      .order('checked_in_at', { ascending: false })

    if (from) query = query.gte('checked_in_at', from)
    if (to) {
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      query = query.lt('checked_in_at', toDate.toISOString())
    }

    const { data } = await query
    setSessions(data ?? [])
    setLoading(false)
  }, [profile, from, to])

  useEffect(() => { if (profile) fetchSessions() }, [profile, fetchSessions])

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0F2040] mb-6">My Timesheet</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          className="text-sm border border-[#BECDE8] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          className="text-sm border border-[#BECDE8] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
        {(from || to) && (
          <Button size="sm" variant="ghost" onClick={() => { setFrom(''); setTo('') }} className="text-gray-500">
            Clear
          </Button>
        )}
      </div>

      {loadingProfile || loading ? (
        <div className="bg-white rounded-xl border border-[#BECDE8] p-8 text-sm text-gray-400 text-center">Loading…</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#BECDE8] p-8 text-sm text-gray-400 text-center">No completed sessions yet.</div>
      ) : (
        <>
          {totalMinutes > 0 && (
            <div className="bg-white rounded-xl border border-[#BECDE8] border-t-[3px] border-t-[#1B3A6B] p-5 mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Total Hours{from || to ? ' (Filtered)' : ''}
              </p>
              <p className="text-2xl font-semibold text-[#0F2040] font-mono">{formatDuration(totalMinutes)}</p>
              <p className="text-xs text-gray-400 mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#BECDE8] overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead className="bg-[#E8EDF7] border-b border-[#BECDE8]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Clock In</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Clock Out</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF7]">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-[#F0F4FA] transition-colors">
                    <td className="px-5 py-3 text-gray-900">{formatDate(s.checked_in_at)}</td>
                    <td className="px-5 py-3 text-gray-700">{formatTime(s.checked_in_at)}</td>
                    <td className="px-5 py-3 text-gray-700">
                      {s.checked_out_at ? formatTime(s.checked_out_at) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-medium text-gray-900">
                      {s.duration_minutes != null ? formatDuration(s.duration_minutes) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
