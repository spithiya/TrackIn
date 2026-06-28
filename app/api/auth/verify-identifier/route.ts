import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { identifier } = await request.json()
  if (!identifier) {
    return NextResponse.json({ error: 'Email or username is required.' }, { status: 400 })
  }

  const service = createServiceClient()
  const trimmed = identifier.trim()

  // Look up by email if it contains @, otherwise by username
  const query = trimmed.includes('@')
    ? service.from('profiles').select('email').eq('email', trimmed).maybeSingle()
    : service.from('profiles').select('email').ilike('username', trimmed).maybeSingle()

  const { data } = await query

  if (!data?.email) {
    return NextResponse.json({ error: 'No account found with that email or username.' }, { status: 404 })
  }

  return NextResponse.json({ email: data.email })
}
