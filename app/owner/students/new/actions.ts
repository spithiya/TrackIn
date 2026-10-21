'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requirePermissionForAction } from '@/lib/permissions'

interface ParentContactInput {
  full_name: string
  relationship: 'Mother' | 'Father' | 'Guardian' | 'Other'
  phone: string
  email: string
  is_primary: boolean
}

interface AddStudentInput {
  first_name: string
  last_name: string
  subjects: 'math' | 'reading' | 'both'
  notes: string
  contacts: ParentContactInput[]
  // Set once the user has confirmed they really do mean to add a second
  // student with the same name as an existing one.
  allowDuplicate?: boolean
}

export type DuplicateStudent = { id: string; is_active: boolean }

// ilike treats % and _ as wildcards — escape them so names match literally.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&')
}

export async function addStudent(
  input: AddStudentInput
): Promise<{ error?: string; duplicates?: DuplicateStudent[] }> {
  const access = await requirePermissionForAction('manage_students')
  if (!access.orgId) return { error: access.error }
  const orgId = access.orgId

  const service = createServiceClient()
  const firstName = input.first_name.trim()
  const lastName = input.last_name.trim()

  // An owner account has exactly one location, so every student belongs to it.
  const { data: location } = await service
    .from('locations')
    .select('id')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  if (!location) return { error: 'Add your location first (under Locations) before adding students.' }

  if (!input.allowDuplicate) {
    const { data: matches } = await service
      .from('students')
      .select('id, is_active')
      .eq('org_id', orgId)
      .ilike('first_name', escapeLike(firstName))
      .ilike('last_name', escapeLike(lastName))
    if (matches && matches.length > 0) return { duplicates: matches }
  }

  const { data: student, error: studentError } = await service
    .from('students')
    .insert({
      org_id: orgId,
      first_name: firstName,
      last_name: lastName,
      subjects: input.subjects,
      location_id: location.id,
      notes: input.notes.trim() || null,
      is_active: true,
    })
    .select('id')
    .single()

  if (studentError || !student) {
    return { error: studentError?.message ?? 'Failed to create student.' }
  }

  // A contact only needs a phone to be worth saving — name is optional
  // (see the form's own validation, which only requires a phone).
  const filledContacts = input.contacts.filter(c => c.full_name.trim() || c.phone.trim())
  if (filledContacts.length > 0) {
    const { error: contactsError } = await service.from('parent_contacts').insert(
      filledContacts.map(c => ({
        student_id: student.id,
        org_id: orgId,
        full_name: c.full_name.trim() || null,
        relationship: c.relationship,
        phone: c.phone.trim() || null,
        email: c.email.trim() || null,
        is_primary: c.is_primary,
      }))
    )
    if (contactsError) return { error: contactsError.message }
  }

  return {}
}
