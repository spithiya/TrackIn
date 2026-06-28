import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { email, newPassword } = await request.json()

  if (!email || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const service = createServiceClient()

  // Look up the auth user by email
  const { data: { users }, error: listError } = await service.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json({ error: 'Failed to look up account.' }, { status: 500 })
  }

  const user = users.find(u => u.email === email)
  if (!user) {
    return NextResponse.json({ error: 'No account found.' }, { status: 404 })
  }

  const { error: updateError } = await service.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
