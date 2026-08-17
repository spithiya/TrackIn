'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { USERNAME_RE, verifyCurrentPassword, isUsernameTaken } from '@/lib/account-settings'

export async function updateProfileInfo(input: {
  first_name: string
  last_name: string
  phone: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const firstName = input.first_name.trim()
  const lastName = input.last_name.trim()
  if (!firstName || !lastName) return { error: 'First and last name are required.' }

  const service = createServiceClient()

  const { error: memberError } = await service
    .from('staff_members')
    .update({ first_name: firstName, last_name: lastName, phone: input.phone.trim() || null })
    .eq('profile_id', user.id)

  if (memberError) return { error: memberError.message }

  // Keep profiles.full_name in sync — not shown anywhere today, but it's
  // the canonical "display name" for the account record.
  const { error: profileError } = await service
    .from('profiles')
    .update({ full_name: `${firstName} ${lastName}` })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }
  return {}
}

export async function updateAccountSecurity(input: {
  currentPassword: string
  username: string
  email: string
  newPassword: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Not authenticated.' }

  if (!input.currentPassword) return { error: 'Enter your current password to save these changes.' }

  const ok = await verifyCurrentPassword(user.email, input.currentPassword)
  if (!ok) return { error: 'Current password is incorrect.' }

  const username = input.username.trim()
  if (!USERNAME_RE.test(username)) {
    return { error: 'Username must be 3–20 characters and contain only letters, numbers, _ or -.' }
  }
  const email = input.email.trim()
  if (!email) return { error: 'Email is required.' }

  if (await isUsernameTaken(username, user.id)) {
    return { error: 'That username is already taken.' }
  }

  const service = createServiceClient()

  if (email !== user.email) {
    const { error: emailError } = await service.auth.admin.updateUserById(user.id, {
      email,
      email_confirm: true,
    })
    if (emailError) return { error: emailError.message }
  }

  if (input.newPassword) {
    if (input.newPassword.length < 8) return { error: 'New password must be at least 8 characters.' }
    const { error: pwError } = await service.auth.admin.updateUserById(user.id, {
      password: input.newPassword,
    })
    if (pwError) return { error: pwError.message }
  }

  const { error: profileError } = await service
    .from('profiles')
    .update({ username, email })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // staff_members.email is a separate copy shown on the owner's staff
  // detail page — keep it in sync too.
  const { error: memberError } = await service
    .from('staff_members')
    .update({ email })
    .eq('profile_id', user.id)

  if (memberError) return { error: memberError.message }
  return {}
}

export async function deleteMyAccount(currentPassword: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Not authenticated.' }

  if (!currentPassword) return { error: 'Enter your current password to confirm account deletion.' }

  const ok = await verifyCurrentPassword(user.email, currentPassword)
  if (!ok) return { error: 'Current password is incorrect.' }

  const service = createServiceClient()

  // staff_members has real historical records (timesheets, check-ins)
  // pointing at it with NOT NULL foreign keys — it can't be hard-deleted.
  // Deactivate it and only remove the login; the roster record (name,
  // history) survives with profile_id set to null via cascade below.
  await service.from('staff_members').update({ is_active: false }).eq('profile_id', user.id)

  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  return {}
}
