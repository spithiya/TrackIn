import twilio from 'twilio'

export async function sendPickupSMS(to: string, studentName: string, centerName: string) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  const message = `Hi! ${studentName} has been checked out of ${centerName} and is ready to be picked up. Thank you!`

  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })

  return { sid: result.sid, status: result.status, message }
}
