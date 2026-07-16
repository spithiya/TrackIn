import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

function verifyResetToken(email: string, token: string): boolean {
  const secret = process.env.PASSWORD_RESET_SECRET
  if (!secret) return false
  const [ts, sig] = token.split(':')
  if (!ts || !sig) return false
  const age = Math.floor(Date.now() / 1000) - parseInt(ts, 10)
  if (age < 0 || age > 600) return false // expires after 10 minutes
  const expected = createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const { email, newPassword, resetToken } = await request.json()

  if (!email || !newPassword || !resetToken) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }
  if (!verifyResetToken(email, resetToken)) {
    return NextResponse.json({ error: 'Reset link has expired. Please start over.' }, { status: 403 })
  }

  const service = createServiceClient()

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
