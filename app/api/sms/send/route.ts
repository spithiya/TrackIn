import { NextResponse } from 'next/server'
import { sendPickupSMS } from '@/lib/twilio'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`sms:${getIp(request)}`, 10, 5 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const { to, studentName, centerName, checkinId, orgId } = await request.json()

  if (!to || !studentName || !centerName || !checkinId || !orgId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify the checkin exists, belongs to the claimed org, and was checked out recently
  const { data: checkin } = await supabase
    .from('student_checkins')
    .select('org_id, checked_out_at')
    .eq('id', checkinId)
    .not('checked_out_at', 'is', null)
    .maybeSingle()

  if (!checkin) {
    return NextResponse.json({ error: 'Invalid checkin' }, { status: 403 })
  }
  if (checkin.org_id !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const ageSeconds = (Date.now() - new Date(checkin.checked_out_at!).getTime()) / 1000
  if (ageSeconds > 300) {
    return NextResponse.json({ error: 'Checkin too old to send SMS' }, { status: 403 })
  }

  try {
    const result = await sendPickupSMS(to, studentName, centerName)

    await supabase.from('sms_log').insert({
      org_id: orgId,
      checkin_id: checkinId,
      to_phone: to,
      message: result.message,
      twilio_sid: result.sid,
      status: result.status,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SMS error:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
