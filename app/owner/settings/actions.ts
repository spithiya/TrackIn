'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { USERNAME_RE, verifyCurrentPassword, isUsernameTaken } from '@/lib/account-settings'

export async function updateProfileInfo(input: {
  full_name: string
  phone: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const fullName = input.full_name.trim()
  if (!fullName) return { error: 'Name is required.' }

  const service = createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ full_name: fullName, phone: input.phone.trim() || null })
    .eq('id', user.id)

  if (error) return { error: error.message }
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
  return {}
}
