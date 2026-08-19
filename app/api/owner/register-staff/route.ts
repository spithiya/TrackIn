import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isUsernameConflictError } from '@/lib/account-settings'

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/

export async function POST(request: Request) {
  // Verify the caller is an authenticated owner
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!ownerProfile || ownerProfile.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    first_name, last_name, email, username, password,
    phone, role_title, dob, subjects, location_id,
  } = await request.json()

  if (!first_name || !last_name || !email || !username || !password || !subjects || !location_id) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: 'Username must be 3–20 characters: letters, numbers, _ or - only.' },
      { status: 400 }
    )
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check username uniqueness
  const { data: existingUsername } = await service
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle()

  if (existingUsername) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
  }

  // Create the Supabase auth user
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create login.' }, { status: 400 })
  }

  const staffUserId = authData.user.id

  try {
    // Create the profile (links the auth user to this org as a staff member)
    const { error: profileError } = await service.from('profiles').insert({
      id: staffUserId,
      org_id: ownerProfile.org_id,
      role: 'staff',
      full_name: `${first_name.trim()} ${last_name.trim()}`,
      email,
      username,
    })

    if (profileError) {
      await service.auth.admin.deleteUser(staffUserId)
      if (isUsernameConflictError(profileError)) {
        return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create staff profile.' }, { status: 500 })
    }

    // Create the staff_members record, linked to the new auth user
    const { error: memberError } = await service.from('staff_members').insert({
      org_id: ownerProfile.org_id,
      profile_id: staffUserId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email,
      phone: phone?.trim() || null,
      role_title: role_title?.trim() || null,
      dob: dob || null,
      subjects,
      location_id,
      is_active: true,
    })

    if (memberError) {
      await service.auth.admin.deleteUser(staffUserId)
      return NextResponse.json({ error: 'Failed to create staff record.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    await service.auth.admin.deleteUser(staffUserId)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
