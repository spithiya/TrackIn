import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`kiosk-checkout:${getIp(request)}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const { locationId, checkinId } = await request.json()
  if (!locationId || !checkinId) {
    return NextResponse.json({ error: 'Missing locationId or checkinId.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // checkout_student() itself doesn't check location/org — verify the
  // checkin actually belongs to this kiosk's location before calling it,
  // so a direct API call can't close out another location's session.
  const { data: checkin } = await supabase
    .from('student_checkins')
    .select('id')
    .eq('id', checkinId)
    .eq('location_id', locationId)
    .is('checked_out_at', null)
    .maybeSingle()

  if (!checkin) {
    return NextResponse.json({ error: 'Checkin not found at this location.' }, { status: 404 })
  }

  const { data, error } = await supabase.rpc('checkout_student', { checkin_id: checkinId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, ...data })
}
