'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requirePermissionForAction } from '@/lib/permissions'
import { TIME_LIMITS } from '@/lib/constants'

async function getAuthOrgId(): Promise<string | null> {
  const access = await requirePermissionForAction('manage_students')
  return access.orgId ?? null
}

export async function updateStudent(
  studentId: string,
  patch: {
    first_name: string
    last_name: string
    dob: string | null
    subjects: 'math' | 'reading' | 'both'
    location_id: string
    notes: string | null
    is_active: boolean
  }
): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'You do not have permission to do this.' }

  const service = createServiceClient()
  const { error } = await service.from('students').update(patch).eq('id', studentId).eq('org_id', orgId)
  if (error) return { error: error.message }

  // subjects_snapshot/time_limit_minutes are frozen on student_checkins at
  // check-in time so historical records stay accurate — but if this student
  // is currently checked in, sync their live session to the new subjects so
  // the timer color/limit updates immediately instead of on their next visit.
  await service
    .from('student_checkins')
    .update({
      subjects_snapshot: patch.subjects,
      time_limit_minutes: patch.subjects === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single,
    })
    .eq('student_id', studentId)
    .eq('org_id', orgId)
    .is('checked_out_at', null)

  return {}
}

export async function toggleStudentActive(studentId: string, is_active: boolean): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'You do not have permission to do this.' }

  const service = createServiceClient()
  const { error } = await service.from('students').update({ is_active }).eq('id', studentId).eq('org_id', orgId)
  return error ? { error: error.message } : {}
}

export async function addContact(input: {
  student_id: string
  full_name: string
  relationship: 'Mother' | 'Father' | 'Guardian' | 'Other'
  phone: string
  email: string
}): Promise<{ id?: string; error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'You do not have permission to do this.' }

  const service = createServiceClient()
  const { data, error } = await service
    .from('parent_contacts')
    .insert({
      student_id: input.student_id,
      org_id: orgId,
      full_name: input.full_name.trim(),
      relationship: input.relationship,
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      is_primary: false,
    })
    .select('id')
    .single()

  return error ? { error: error.message } : { id: data!.id }
}

export async function deleteContact(contactId: string): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()
  const { error } = await service.from('parent_contacts').delete().eq('id', contactId).eq('org_id', orgId)
  return error ? { error: error.message } : {}
}

export async function setPrimaryContact(contactId: string, studentId: string): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()
  await service.from('parent_contacts').update({ is_primary: false }).eq('student_id', studentId).eq('org_id', orgId)
  const { error } = await service.from('parent_contacts').update({ is_primary: true }).eq('id', contactId).eq('org_id', orgId)
  return error ? { error: error.message } : {}
}

export async function deleteStudent(studentId: string): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()
  const { error } = await service
    .from('students')
    .update({ is_active: false })
    .eq('id', studentId)
    .eq('org_id', orgId)
  return error ? { error: error.message } : {}
}
