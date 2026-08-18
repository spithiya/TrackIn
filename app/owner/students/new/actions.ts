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
  location_id: string
  notes: string
  contacts: ParentContactInput[]
}

export async function addStudent(input: AddStudentInput): Promise<{ error?: string }> {
  const access = await requirePermissionForAction('manage_students')
  if (!access.orgId) return { error: access.error }
  const orgId = access.orgId

  const service = createServiceClient()

  const { data: student, error: studentError } = await service
    .from('students')
    .insert({
      org_id: orgId,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      subjects: input.subjects,
      location_id: input.location_id,
      notes: input.notes.trim() || null,
      is_active: true,
    })
    .select('id')
    .single()

  if (studentError || !student) {
    return { error: studentError?.message ?? 'Failed to create student.' }
  }

  const namedContacts = input.contacts.filter(c => c.full_name.trim())
  if (namedContacts.length > 0) {
    const { error: contactsError } = await service.from('parent_contacts').insert(
      namedContacts.map(c => ({
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
