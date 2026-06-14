'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
  dob: string
  subjects: 'math' | 'reading' | 'both'
  location_id: string
  notes: string
  contacts: ParentContactInput[]
}

export async function addStudent(input: AddStudentInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) return { error: 'Profile not found.' }

  const service = createServiceClient()
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log('[addStudent] url:', serviceUrl?.slice(0, 30))
  console.log('[addStudent] key role:', serviceKey ? serviceKey.split('.')[1] ? JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString()).role : 'decode-fail' : 'MISSING')

  const { data: student, error: studentError } = await service
    .from('students')
    .insert({
      org_id: profile.org_id,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      dob: input.dob || null,
      subjects: input.subjects,
      location_id: input.location_id,
      notes: input.notes.trim() || null,
      is_active: true,
    })
    .select('id')
    .single()

  console.log('[addStudent] studentError:', studentError?.message, 'student:', student?.id)
  if (studentError || !student) {
    return { error: studentError?.message ?? 'Failed to create student.' }
  }

  const namedContacts = input.contacts.filter(c => c.full_name.trim())
  if (namedContacts.length > 0) {
    const { error: contactsError } = await service.from('parent_contacts').insert(
      namedContacts.map(c => ({
        student_id: student.id,
        org_id: profile.org_id,
        full_name: c.full_name.trim(),
        relationship: c.relationship,
        phone: c.phone.trim() || null,
        email: c.email.trim() || null,
        is_primary: c.is_primary,
      }))
    )
    if (contactsError) return { error: contactsError.message }
  }

  redirect('/owner/students')
}
