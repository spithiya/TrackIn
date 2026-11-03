import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'
import { getKioskContext } from '@/lib/kiosk'
import { getOrgDisplaySettings, DEFAULT_ORG_SETTINGS } from '@/lib/org-settings'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const { allowed, retryAfterMs } = checkRateLimit(`kiosk-active:${getIp(request)}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const { locationId } = await params

  const ctx = await getKioskContext()
  if (!ctx || ctx.locationId !== locationId) {
    return NextResponse.json({ error: 'Not authorized for this location.' }, { status: 403 })
  }

  const supabase = createServiceClient()

  const [{ data, error }, { data: location }] = await Promise.all([
    supabase
      .from('student_checkins')
      .select('id, student_id, checked_in_at, subjects_snapshot')
      .eq('location_id', locationId)
      .is('checked_out_at', null),
    supabase.from('locations').select('org_id').eq('id', locationId).maybeSingle(),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Sent along with every poll so a kiosk left open all day picks up a
  // change to this setting without anyone reloading it.
  const settings = location ? await getOrgDisplaySettings(location.org_id) : DEFAULT_ORG_SETTINGS
  return NextResponse.json({ checkins: data ?? [], hideCheckedIn: settings.kiosk_hide_checked_in, showCount: settings.kiosk_show_student_count })
}
