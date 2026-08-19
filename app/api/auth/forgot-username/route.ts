import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'
import { sendUsernameReminderEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`forgot-username:${getIp(request)}`, 5, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const { email } = await request.json()
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const service = createServiceClient()

  // An owner running multiple locations can have several accounts under
  // the same real email (see auth_email) — collect all of them, not just
  // the first match.
  const { data: profiles } = await service
    .from('profiles')
    .select('username')
    .ilike('email', email.trim())

  const usernames = (profiles ?? [])
    .map(p => p.username)
    .filter((u): u is string => !!u)

  if (usernames.length > 0) {
    const { error } = await sendUsernameReminderEmail(email.trim(), usernames)
    if (error) console.error('sendUsernameReminderEmail failed:', error)
  }

  // Same response either way — don't reveal whether an account exists.
  return NextResponse.json({ success: true })
}
