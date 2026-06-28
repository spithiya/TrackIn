import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
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
