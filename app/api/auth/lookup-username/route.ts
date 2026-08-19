import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`lookup:${getIp(request)}`, 10, 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const { username } = await request.json()

  if (!username) {
    return NextResponse.json({ error: 'Username is required.' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data } = await service
    .from('profiles')
    .select('email, auth_email')
    .ilike('username', username)
    .maybeSingle()

  if (!data?.email) {
    return NextResponse.json({ error: 'No account found with that username.' }, { status: 404 })
  }

  // auth_email is the actual Supabase Auth login identifier when it
  // differs from the real, human-facing email (see owner accounts that
  // share an email across locations) — fall back to email otherwise.
  return NextResponse.json({ email: data.auth_email ?? data.email })
}
