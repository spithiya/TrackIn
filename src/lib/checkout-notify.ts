import { createServiceClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

export interface NotifyResult {
  sent: boolean
  reason?: string
}

// Texts the student's primary parent/guardian contact that they've been
// checked out and are ready for pickup. Called from every checkout path
// (kiosk, owner, staff) right after the checkout itself succeeds.
// Re-derives everything from checkinId server-side rather than trusting
// client-supplied contact info.
export async function notifyPickupReady(checkinId: string): Promise<NotifyResult> {
  const service = createServiceClient()

  const { data: checkin } = await service
    .from('student_checkins')
    .select('id, org_id, student_id, checked_out_at, sms_sent')
    .eq('id', checkinId)
    .maybeSingle()

  if (!checkin || !checkin.checked_out_at || checkin.sms_sent) {
    return { sent: false, reason: 'not_eligible' }
  }

  const [{ data: student }, { data: contacts }] = await Promise.all([
    service.from('students').select('first_name').eq('id', checkin.student_id).single(),
    service.from('parent_contacts').select('phone').eq('student_id', checkin.student_id).eq('is_primary', true).limit(1),
  ])

  const phone = contacts?.[0]?.phone
  if (!phone) return { sent: false, reason: 'no_contact_phone' }

  const message = `${student?.first_name ?? 'Your student'} is checked out and ready for pickup!`

  const { error, providerMessageId } = await sendSms(phone, message)

  await service.from('sms_log').insert({
    org_id: checkin.org_id,
    checkin_id: checkin.id,
    to_phone: phone,
    message,
    status: error ? 'failed' : 'sent',
    telnyx_message_id: providerMessageId ?? null,
  })

  if (error) {
    console.error('notifyPickupReady failed:', error)
    return { sent: false, reason: error }
  }

  await service.from('student_checkins').update({ sms_sent: true }).eq('id', checkin.id)
  return { sent: true }
}
