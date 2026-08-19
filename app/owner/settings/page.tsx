import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'
import { requireOwner } from '@/lib/permissions'

export default async function OwnerSettingsPage() {
  const access = await requireOwner()
  const supabase = await createClient()

  const [{ data: profile, error }, { data: kioskProfiles }, { data: locations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, username, phone')
      .eq('id', access.userId)
      .single(),
    supabase
      .from('profiles')
      .select('id, username, location_id')
      .eq('org_id', access.orgId)
      .eq('role', 'kiosk')
      .order('created_at'),
    supabase.from('locations').select('id, name').eq('org_id', access.orgId),
  ])

  // A failed query (e.g. a schema mismatch) is not the same as "not
  // logged in" — don't silently bounce an authenticated owner back to
  // the login screen with no explanation.
  if (error || !profile) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          Couldn&apos;t load your profile settings. Please try again shortly.
        </p>
      </div>
    )
  }

  const locationNames = new Map((locations ?? []).map(l => [l.id, l.name]))
  const kioskAccounts = (kioskProfiles ?? []).map(k => ({
    id: k.id,
    username: k.username ?? '',
    locationName: k.location_id ? locationNames.get(k.location_id) ?? null : null,
  }))

  return <SettingsClient profile={profile} kioskAccounts={kioskAccounts} />
}
