import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

function generateResetToken(email: string): string {
  const secret = process.env.PASSWORD_RESET_SECRET
  if (!secret) throw new Error('PASSWORD_RESET_SECRET is not set')
  const ts = Math.floor(Date.now() / 1000).toString()
  const sig = createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex')
  return `${ts}:${sig}`
}

export async function POST(request: Request) {
  const { identifier } = await request.json()
  if (!identifier) {
    return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 })
  }

  const service = createServiceClient()
  const trimmed = identifier.trim()

  const query = trimmed.includes('@')
    ? service.from('profiles').select('email').eq('email', trimmed).maybeSingle()
    : service.from('profiles').select('email').ilike('username', trimmed).maybeSingle()

  const { data } = await query

  if (!data?.email) {
    return NextResponse.json({ error: 'No account found with that email or username.' }, { status: 404 })
  }

  const resetToken = generateResetToken(data.email)
  return NextResponse.json({ email: data.email, resetToken })
}
