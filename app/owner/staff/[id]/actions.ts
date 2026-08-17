'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireOwnerForAction } from '@/lib/permissions'

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
    subjects: 'math' | 'reading' | 'both'
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

export async function deleteStaff(staffId: string): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()
  const { error } = await service
    .from('staff_members')
    .update({ is_active: false })
    .eq('id', staffId)
    .eq('org_id', orgId)
  return error ? { error: error.message } : {}
}
