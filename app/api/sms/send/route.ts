import { NextResponse } from 'next/server'
import { sendPickupSMS } from '@/src/lib/twilio'
import { createServiceClient } from '@/src/lib/supabase/server'

export async function POST(request: Request) {
  const { to, studentName, centerName, checkinId, orgId } = await request.json()

  if (!to || !studentName || !centerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const result = await sendPickupSMS(to, studentName, centerName)

    // Log to sms_log
    const supabase = createServiceClient()
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
