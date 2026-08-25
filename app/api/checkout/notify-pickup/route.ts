import { NextResponse } from 'next/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'
import { getAccessContext } from '@/lib/permissions'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyPickupReady } from '@/lib/checkout-notify'

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`notify-pickup:${getIp(request)}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const access = await getAccessContext()
  if (!access) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { checkinId } = await request.json()
  if (!checkinId) return NextResponse.json({ error: 'Missing checkinId.' }, { status: 400 })

  // Only let a caller trigger this for a checkin in their own org.
  const service = createServiceClient()
  const { data: checkin } = await service.from('student_checkins').select('org_id').eq('id', checkinId).maybeSingle()
  if (!checkin || checkin.org_id !== access.orgId) {
    return NextResponse.json({ error: 'Checkin not found.' }, { status: 404 })
  }

  const result = await notifyPickupReady(checkinId)
  return NextResponse.json(result)
}
