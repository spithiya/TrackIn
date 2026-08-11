import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

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
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('student_checkins')
    .select('id, student_id, checked_in_at, subjects_snapshot')
    .eq('location_id', locationId)
    .is('checked_out_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checkins: data ?? [] })
}
