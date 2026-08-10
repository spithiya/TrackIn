'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveStudents } from '@/hooks/use-active-students'
import { useSessionAlertWatcher } from '@/hooks/use-session-alert-watcher'
import { formatTime, formatDate } from '@/lib/utils'
import { Bell } from 'lucide-react'
import type { Tables } from '@/lib/supabase/types'

type Alert = Tables<'session_alerts'>

export function NotificationBell({
  orgId,
  staffId,
  locationIds,
}: {
  orgId: string | null
  staffId: string | null
  locationIds: string[]
}) {
  const { students } = useActiveStudents(orgId, locationIds, staffId)
  useSessionAlertWatcher(orgId, staffId, students)

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const channelId = useRef(crypto.randomUUID()).current

  const loadAlerts = useCallback(async () => {
    if (!orgId || !staffId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('session_alerts')
      .select('*')
      .eq('org_id', orgId)
      .eq('assigned_staff_id', staffId)
      .order('created_at', { ascending: false })
      .limit(20)
    setAlerts(data ?? [])
  }, [orgId, staffId])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`session_alerts:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_alerts', filter: `org_id=eq.${orgId}` },
        () => loadAlerts()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orgId, loadAlerts, channelId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = alerts.filter(a => !a.acknowledged_at).length

  async function markAllRead() {
    if (!staffId || unreadCount === 0) return
    const supabase = createClient()
    await supabase
      .from('session_alerts')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('assigned_staff_id', staffId)
      .is('acknowledged_at', null)
    loadAlerts()
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('session_alerts').update({ acknowledged_at: new Date().toISOString() }).eq('id', id)
    loadAlerts()
  }

  if (!orgId || !staffId) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-[#F0F4FA] hover:text-[#1B3A6B] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[#BECDE8] rounded-lg shadow-lg z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E8EDF7]">
            <span className="text-sm font-semibold text-[#0F2040]">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#1B3A6B] hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-[#E8EDF7]">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No alerts yet.</p>
            ) : (
              alerts.map(a => (
                <button
                  key={a.id}
                  onClick={() => markRead(a.id)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-[#F0F4FA] transition-colors ${!a.acknowledged_at ? 'bg-[#F7FAFF]' : ''}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.level === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <span className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.created_at)} · {formatTime(a.created_at)}</p>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
