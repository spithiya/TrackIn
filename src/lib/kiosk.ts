import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface KioskContext {
  userId: string
  orgId: string
  locationId: string | null
}

// Reads the current session and confirms it's a kiosk account. Returns
// null (rather than redirecting) so it works from both pages and API
// routes — callers decide how to respond to "not a kiosk session."
export async function getKioskContext(): Promise<KioskContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id, location_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'kiosk') return null

  return { userId: user.id, orgId: profile.org_id, locationId: profile.location_id }
}

// Page/layout guard — redirects instead of returning null.
export async function requireKioskSession(): Promise<KioskContext> {
  const ctx = await getKioskContext()
  if (!ctx) redirect('/auth/login')
  return ctx
}
