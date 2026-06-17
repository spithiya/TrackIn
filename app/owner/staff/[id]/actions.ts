'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

async function getAuthOrgId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  return profile?.org_id ?? null
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
