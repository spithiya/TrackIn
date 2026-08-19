import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'
import { TIME_LIMITS } from '@/lib/constants'
import { getKioskContext } from '@/lib/kiosk'

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`kiosk-checkin:${getIp(request)}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const { locationId, studentId } = await request.json()
  if (!locationId || !studentId) {
    return NextResponse.json({ error: 'Missing locationId or studentId.' }, { status: 400 })
  }

  const ctx = await getKioskContext()
  if (!ctx || ctx.locationId !== locationId) {
    return NextResponse.json({ error: 'Not authorized for this location.' }, { status: 403 })
  }

  const supabase = createServiceClient()

  // Only allow checking in a student who actually belongs to this kiosk's
  // location — prevents a direct API call from checking in (or leaking the
  // existence of) a student from a different location/organization.
  const { data: student } = await supabase
    .from('students')
    .select('id, org_id, location_id, subjects, is_active')
    .eq('id', studentId)
    .eq('location_id', locationId)
    .eq('is_active', true)
    .maybeSingle()

  if (!student) {
    return NextResponse.json({ error: 'Student not found at this location.' }, { status: 404 })
  }

  const { error } = await supabase.from('student_checkins').insert({
    org_id: student.org_id,
    student_id: student.id,
    location_id: locationId,
    subjects_snapshot: student.subjects,
    time_limit_minutes: student.subjects === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single,
    checkin_method: 'kiosk',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
