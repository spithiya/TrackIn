// Converts a stored 10-digit US phone number to the E.164 format Telnyx's
// API requires. Numbers are saved elsewhere in the app as plain digits
// with no country code (e.g. "6547891023").
export function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export async function sendSms(toPhone: string, body: string): Promise<{ error?: string; providerMessageId?: string }> {
  const apiKey = process.env.TELNYX_API_KEY
  const from = process.env.TELNYX_FROM_NUMBER
  if (!apiKey || !from) return { error: 'SMS sending is not configured.' }

  const to = toE164(toPhone)
  if (!to) return { error: 'Invalid phone number.' }

  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, text: body }),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    return { error: json?.errors?.[0]?.detail ?? `Telnyx request failed (${res.status}).` }
  }

  return { providerMessageId: json?.data?.id }
}
