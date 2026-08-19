'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { USERNAME_RE, verifyCurrentPassword, isUsernameTaken } from '@/lib/account-settings'
import { requireOwnerForAction } from '@/lib/permissions'

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

// Kiosk logins aren't "forgotten" by anyone in particular — the owner
// just sets a new password directly, with no email step involved.
export async function updateKioskPassword(
  kioskProfileId: string,
  newPassword: string
): Promise<{ error?: string }> {
  const access = await requireOwnerForAction()
  if (access.error) return { error: access.error }

  if (newPassword.length < 8) return { error: 'Password must be at least 8 characters.' }

  const service = createServiceClient()

  const { data: kiosk } = await service
    .from('profiles')
    .select('id, org_id, role')
    .eq('id', kioskProfileId)
    .single()

  if (!kiosk || kiosk.role !== 'kiosk' || kiosk.org_id !== access.orgId) {
    return { error: 'Kiosk account not found.' }
  }

  const { error } = await service.auth.admin.updateUserById(kioskProfileId, { password: newPassword })
  if (error) return { error: error.message }
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

  const { data: profile } = await service.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) return { error: 'Profile not found.' }

  // An owner is the root of an entire organization — refuse to cascade-delete
  // real operational data through a one-click self-service action. Only
  // allow this when the org has no staff or students on record yet (which
  // also guarantees no check-in/timesheet history exists, since those
  // always reference a student or staff member).
  const [{ count: staffCount }, { count: studentCount }] = await Promise.all([
    service.from('staff_members').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id),
    service.from('students').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id),
  ])

  if ((staffCount ?? 0) > 0 || (studentCount ?? 0) > 0) {
    return {
      error: `Your organization has ${staffCount ?? 0} staff member(s) and ${studentCount ?? 0} student(s) on record. For safety, self-service account deletion is only available for organizations with no data yet.`,
    }
  }

  const { error: deleteUserError } = await service.auth.admin.deleteUser(user.id)
  if (deleteUserError) return { error: deleteUserError.message }

  // profiles is already gone via auth.users' cascade — clean up the now
  // owner-less org too (cascades any locations it still has).
  await service.from('organizations').delete().eq('id', profile.org_id)

  return {}
}
