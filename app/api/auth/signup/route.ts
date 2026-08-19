import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp } from '@/lib/rate-limit'
import { generateKioskUsername, deriveTaggedEmail, isDuplicateEmailError, isUsernameConflictError } from '@/lib/account-settings'

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/
const KIOSK_DEFAULT_PASSWORD = '12345678'

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`signup:${getIp(request)}`, 3, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }

  const { email, username, password, role } = await request.json()

  if (!email || !username || !password || !role) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (role !== 'owner') {
    return NextResponse.json({ error: 'Only owner accounts can be created here.' }, { status: 400 })
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: 'Username must be 3–20 characters and contain only letters, numbers, _ or -.' },
      { status: 400 }
    )
  }

  const service = createServiceClient()

  // Check username uniqueness (case-insensitive)
  const { data: existing } = await service
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 })
  }

  // Create the Supabase auth user. An owner running multiple locations
  // reuses the same real email across accounts — Supabase itself still
  // requires a unique email per account, so when that email's already
  // taken, fall back to a plus-tagged variant (tagged by this account's
  // own username, which is already unique) purely for Supabase's sake.
  // The real email stays what's shown everywhere in the app.
  let authEmail = email
  let { data: authData, error: authError } = await service.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
  })

  if (authError && isDuplicateEmailError(authError)) {
    const tagged = deriveTaggedEmail(email, username)
    if (tagged) {
      authEmail = tagged
      ;({ data: authData, error: authError } = await service.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
      }))
    }
  }

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create account.' }, { status: 400 })
  }

  const userId = authData.user.id

  try {
    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({ name: 'My Organization' })
      .select('id')
      .single()

    if (orgError || !org) {
      await service.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create organization.' }, { status: 500 })
    }

    const { error: profileError } = await service.from('profiles').insert({
      id: userId,
      org_id: org.id,
      role: 'owner',
      full_name: username,
      email,
      username,
      auth_email: authEmail !== email ? authEmail : null,
    })

    if (profileError) {
      await service.auth.admin.deleteUser(userId)
      if (isUsernameConflictError(profileError)) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
    }

    // Every owner account gets a kiosk login for its (eventual, single)
    // location. It has no location_id yet — addLocation() binds it once
    // the owner creates their location.
    const kioskUsername = await generateKioskUsername()
    const kioskEmail = `${kioskUsername}@kiosk.trackin.internal`

    const { data: kioskAuth, error: kioskAuthError } = await service.auth.admin.createUser({
      email: kioskEmail,
      password: KIOSK_DEFAULT_PASSWORD,
      email_confirm: true,
    })

    if (kioskAuthError || !kioskAuth.user) {
      await service.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create kiosk account.' }, { status: 500 })
    }

    const { error: kioskProfileError } = await service.from('profiles').insert({
      id: kioskAuth.user.id,
      org_id: org.id,
      role: 'kiosk',
      full_name: 'Kiosk',
      email: kioskEmail,
      username: kioskUsername,
    })

    if (kioskProfileError) {
      await service.auth.admin.deleteUser(kioskAuth.user.id)
      await service.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Failed to create kiosk account.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, role: 'owner' })
  } catch {
    await service.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Unexpected error during signup.' }, { status: 500 })
  }
}
