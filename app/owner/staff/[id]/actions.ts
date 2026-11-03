'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireOwnerForAction } from '@/lib/permissions'
import { USERNAME_RE, isUsernameTaken, isUsernameConflictError } from '@/lib/account-settings'
import { isBreachedPassword, BREACHED_PASSWORD_ERROR } from '@/lib/password-check'

async function getAuthOrgId(): Promise<string | null> {
  const access = await requireOwnerForAction()
  return access.orgId ?? null
}

export async function updateStaffPermissions(
  staffId: string,
  permissions: {
    can_manage_students: boolean
    can_view_history: boolean
    can_view_analytics: boolean
    can_control_checkin: boolean
  }
): Promise<{ error?: string }> {
  const access = await requireOwnerForAction()
  if (!access.orgId) return { error: access.error }

  const service = createServiceClient()
  const { error } = await service
    .from('staff_members')
    .update(permissions)
    .eq('id', staffId)
    .eq('org_id', access.orgId)
  return error ? { error: error.message } : {}
}

export async function updateStaff(
  staffId: string,
  patch: {
    first_name: string
    last_name: string
    dob: string | null
    phone: string | null
    email: string | null
    role_title: string | null
    subjects: 'math' | 'reading' | 'both' | null
    location_id: string
    location_ids: string[] | null
  }
): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()
  const { error } = await service
    .from('staff_members')
    .update(patch)
    .eq('id', staffId)
    .eq('org_id', orgId)
  return error ? { error: error.message } : {}
}

// The owner can view/change a staff member's login directly — no email
// step, no "current password" needed, since it's not the owner's own
// account. Username and password are handled independently: leaving
// newPassword blank keeps the current password.
export async function updateStaffLogin(
  staffId: string,
  input: { username: string; newPassword?: string }
): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()

  const { data: member } = await service
    .from('staff_members')
    .select('profile_id')
    .eq('id', staffId)
    .eq('org_id', orgId)
    .maybeSingle()

  if (!member) return { error: 'Staff member not found.' }
  if (!member.profile_id) return { error: 'This staff member has no login account.' }

  const username = input.username.trim()
  if (!USERNAME_RE.test(username)) {
    return { error: 'Username must be 3–20 characters and contain only letters, numbers, _ or -.' }
  }

  if (await isUsernameTaken(username, member.profile_id)) {
    return { error: 'That username is already taken.' }
  }

  if (input.newPassword) {
    if (input.newPassword.length < 8) return { error: 'Password must be at least 8 characters.' }
    if (await isBreachedPassword(input.newPassword)) return { error: BREACHED_PASSWORD_ERROR }
  }

  const { error: profileError } = await service.from('profiles').update({ username }).eq('id', member.profile_id)
  if (profileError) {
    if (isUsernameConflictError(profileError)) return { error: 'That username is already taken.' }
    return { error: profileError.message }
  }

  if (input.newPassword) {
    const { error: pwError } = await service.auth.admin.updateUserById(member.profile_id, { password: input.newPassword })
    if (pwError) return { error: pwError.message }
  }

  return {}
}

// ~100 years: Supabase Auth has no "forever" ban, and "none" lifts it.
const DEACTIVATED_BAN = '876000h'

// Deactivating keeps the staff member's record and all of their history
// (timesheets, check-ins) but blocks their login and drops them from
// everyday lists (check-in control, staff pickers). Reactivating undoes
// both. The ban is what actually stops sign-in — including a session
// already open on some device, once its access token expires.
export async function setStaffActive(staffId: string, active: boolean): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()

  const { data: member } = await service
    .from('staff_members')
    .select('profile_id')
    .eq('id', staffId)
    .eq('org_id', orgId)
    .maybeSingle()
  if (!member) return { error: 'Staff member not found.' }

  if (member.profile_id) {
    const { error: banError } = await service.auth.admin.updateUserById(member.profile_id, {
      ban_duration: active ? 'none' : DEACTIVATED_BAN,
    })
    if (banError) return { error: banError.message }
  }

  if (!active) {
    // Don't leave a deactivated staff member "on the clock" indefinitely.
    // The duration trigger (migration 005) fills in duration_minutes.
    const { error: clockOutError } = await service
      .from('staff_checkins')
      .update({ checked_out_at: new Date().toISOString(), checked_out_by_owner: true })
      .eq('staff_id', staffId)
      .eq('org_id', orgId)
      .is('checked_out_at', null)
    if (clockOutError) return { error: clockOutError.message }
  }

  const { error } = await service
    .from('staff_members')
    .update({ is_active: active })
    .eq('id', staffId)
    .eq('org_id', orgId)
  return error ? { error: error.message } : {}
}

// Only for staff with no history yet (e.g. registered by mistake). Anyone
// with timesheet or notification records is deactivated instead, so their
// work history stays intact and attributable.
export async function deleteStaff(staffId: string): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()

  const { data: member } = await service
    .from('staff_members')
    .select('profile_id')
    .eq('id', staffId)
    .eq('org_id', orgId)
    .maybeSingle()
  if (!member) return { error: 'Staff member not found.' }

  const [{ count: checkinsCount }, { count: notifCount }] = await Promise.all([
    service.from('staff_checkins').select('*', { count: 'exact', head: true }).eq('staff_id', staffId),
    service.from('staff_notifications').select('*', { count: 'exact', head: true }).eq('staff_id', staffId),
  ])

  if ((checkinsCount ?? 0) > 0 || (notifCount ?? 0) > 0) {
    return { error: 'This staff member has timesheet history, so they can\'t be deleted without losing it. Deactivate them instead.' }
  }

  const { error } = await service.from('staff_members').delete().eq('id', staffId).eq('org_id', orgId)
  if (error) return { error: error.message }
  if (member.profile_id) {
    const { error: authError } = await service.auth.admin.deleteUser(member.profile_id)
    if (authError) return { error: authError.message }
  }
  return {}
}

