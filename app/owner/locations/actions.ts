'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

async function getAuthOrgId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  return profile?.org_id ?? null
}

interface LocationInput {
  name: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  phone: string
  opens_at: string
  closes_at: string
  notes: string
}

export async function addLocation(input: LocationInput): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()

  // Only one location can be linked to an owner account. An owner running
  // more than one location needs a separate owner account per location.
  const { count } = await service
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
  if ((count ?? 0) >= 1) {
    return { error: 'Only one location can be linked to an owner account. To run another location, create a separate owner account for it.' }
  }

  const { data: newLocation, error } = await service.from('locations').insert({
    org_id: orgId,
    name: input.name.trim(),
    address_street: input.address_street.trim(),
    address_city: input.address_city.trim(),
    address_state: input.address_state.trim(),
    address_zip: input.address_zip.trim(),
    phone: input.phone.trim() || null,
    opens_at: input.opens_at,
    closes_at: input.closes_at,
    notes: input.notes.trim() || null,
    is_active: true,
  }).select('id').single()

  if (error) return { error: error.message }

  // Bind this org's kiosk account (created empty at signup) to the
  // location that just gave it something to belong to.
  await service
    .from('profiles')
    .update({ location_id: newLocation.id })
    .eq('org_id', orgId)
    .eq('role', 'kiosk')
    .is('location_id', null)

  return {}
}

export async function deleteLocation(locationId: string): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()
  const { error } = await service
    .from('locations')
    .delete()
    .eq('id', locationId)
    .eq('org_id', orgId)
  return error ? { error: error.message } : {}
}

export async function updateLocation(
  locationId: string,
  input: LocationInput & { is_active: boolean }
): Promise<{ error?: string }> {
  const orgId = await getAuthOrgId()
  if (!orgId) return { error: 'Not authenticated.' }

  const service = createServiceClient()
  const { error } = await service
    .from('locations')
    .update({
      name: input.name.trim(),
      address_street: input.address_street.trim(),
      address_city: input.address_city.trim(),
      address_state: input.address_state.trim(),
      address_zip: input.address_zip.trim(),
      phone: input.phone.trim() || null,
      opens_at: input.opens_at,
      closes_at: input.closes_at,
      notes: input.notes.trim() || null,
      is_active: input.is_active,
    })
    .eq('id', locationId)
    .eq('org_id', orgId)
  return error ? { error: error.message } : {}
}
