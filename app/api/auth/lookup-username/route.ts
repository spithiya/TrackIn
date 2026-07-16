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
    .select('email')
    .ilike('username', username)
    .maybeSingle()

  if (!data?.email) {
    return NextResponse.json({ error: 'No account found with that username.' }, { status: 404 })
  }

  return NextResponse.json({ email: data.email })
}
