'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requirePermissionForAction } from '@/lib/permissions'

interface ImportStudentInput {
  firstName: string
  lastName: string
  subjects: 'math' | 'reading' | 'both'
  phone: string
}

export async function bulkImportStudents(
  locationId: string,
  students: ImportStudentInput[]
): Promise<{ error?: string; imported?: number }> {
  const access = await requirePermissionForAction('manage_students')
  if (!access.orgId) return { error: access.error }
  const orgId = access.orgId
  if (students.length === 0) return { error: 'No valid rows to import.' }

  const service = createServiceClient()

  const { data: location } = await service
    .from('locations')
    .select('id')
    .eq('id', locationId)
    .eq('org_id', orgId)
    .maybeSingle()
  if (!location) return { error: 'Invalid location.' }

  const CHUNK = 500
  let imported = 0

  for (let i = 0; i < students.length; i += CHUNK) {
    const chunk = students.slice(i, i + CHUNK)

    const { data: inserted, error: studentsError } = await service
      .from('students')
      .insert(chunk.map(s => ({
        org_id: orgId,
        first_name: s.firstName,
        last_name: s.lastName,
        subjects: s.subjects,
        location_id: locationId,
        is_active: true,
      })))
      .select('id')

    if (studentsError || !inserted) {
      return { error: studentsError?.message ?? 'Failed to import students.', imported }
    }

    const { error: contactsError } = await service
      .from('parent_contacts')
      .insert(inserted.map((row, idx) => ({
        student_id: row.id,
        org_id: orgId,
        full_name: null,
        relationship: 'Guardian' as const,
        phone: chunk[idx].phone,
        is_primary: true,
      })))

    if (contactsError) {
      return { error: contactsError.message, imported }
    }

    imported += inserted.length
  }

  return { imported }
}
