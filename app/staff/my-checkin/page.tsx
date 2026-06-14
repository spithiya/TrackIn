'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { formatTime, formatDuration, elapsedMinutes, fullName } from '@/lib/utils'
import type { Tables, Views } from '@/lib/supabase/types'

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

export default function StaffMyCheckinPage() {
  const { profile, loading: loadingProfile } = useCurrentUser()
  const [staffMember, setStaffMember] = useState<Tables<'staff_members'> | null>(null)
  const [activeCheckin, setActiveCheckin] = useState<Views<'active_staff'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [toast, setToast] = useState<ToastState>(null)

  const fetchStatus = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const supabase = createClient()

    const { data: member } = await supabase
      .from('staff_members')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle()

    setStaffMember(member)

    if (member) {
      const { data: checkin } = await supabase
        .from('active_staff')
        .select('*')
        .eq('staff_id', member.id)
        .maybeSingle()
      setActiveCheckin(checkin)
    } else {
      setActiveCheckin(null)
    }

    setLoading(false)
  }, [profile])

  useEffect(() => {
    if (profile) fetchStatus()
  }, [profile, fetchStatus])

  // Live elapsed timer
  useEffect(() => {
    if (!activeCheckin) return
    const update = () => setElapsed(elapsedMinutes(activeCheckin.checked_in_at))
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [activeCheckin])

  async function handleCheckin() {
    if (!staffMember || !profile) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('staff_checkins').insert({
      org_id: profile.org_id,
      staff_id: staffMember.id,
      location_id: staffMember.location_id,
      checked_out_by_owner: false,
    })
    if (error) {
      setToast({ message: 'Failed to clock in.', variant: 'red' })
    } else {
      setToast({ message: 'You are clocked in.', variant: 'green' })
      fetchStatus()
    }
    setBusy(false)
  }

  async function handleCheckout() {
    if (!activeCheckin) return
    setBusy(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('checkout_staff', { p_checkin_id: activeCheckin.id, p_by_owner: false })
    if (error) {
      setToast({ message: 'Failed to clock out.', variant: 'red' })
    } else {
      const duration = (data as { duration_minutes: number })?.duration_minutes
      setToast({
        message: duration != null ? `Clocked out. Total: ${formatDuration(duration)}.` : 'Clocked out.',
        variant: 'green',
      })
      setActiveCheckin(null)
      fetchStatus()
    }
    setBusy(false)
  }

  const isLoading = loadingProfile || loading

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Check-in</h1>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-400 text-center">Loading…</div>
      ) : !staffMember ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-sm text-gray-500 text-center">
          No staff profile linked to your account. Contact your owner.
        </div>
      ) : activeCheckin ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Currently clocked in as</p>
              <p className="text-lg font-semibold text-gray-900">
                {fullName(activeCheckin.staff_first_name, activeCheckin.staff_last_name)}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">since {formatTime(activeCheckin.checked_in_at)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Time on duty</p>
                <span className="inline-flex items-center rounded-full px-4 py-1.5 bg-green-100 text-green-800 font-mono font-medium text-sm">
                  {elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`}
                </span>
              </div>
              <Button variant="danger" size="md" onClick={handleCheckout} disabled={busy}>
                {busy ? 'Clocking out…' : 'Clock Out'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center gap-5">
          <div className="text-center">
            <p className="text-gray-900 font-medium">
              {fullName(staffMember.first_name, staffMember.last_name)}
            </p>
            <p className="text-sm text-gray-400 mt-1">Not currently clocked in.</p>
          </div>
          <Button variant="primary" size="lg" onClick={handleCheckin} disabled={busy}>
            {busy ? 'Clocking in…' : 'Clock In'}
          </Button>
        </div>
      )}
    </div>
  )
}
