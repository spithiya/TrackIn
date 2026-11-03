import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { requireKioskSession } from '@/lib/kiosk'
import { KioskClient } from '../kiosk-client'
import { getOrgDisplaySettings, DEFAULT_ORG_SETTINGS } from '@/lib/org-settings'

export default async function LocationKioskPage({
  params,
}: {
  params: Promise<{ locationId: string }>
}) {
  const { locationId } = await params
  const ctx = await requireKioskSession()

  // This kiosk login is only allowed to operate at its own bound location —
  // guessing a different location's URL redirects back to the real one.
  if (ctx.locationId !== locationId) {
    redirect(ctx.locationId ? `/kiosk/${ctx.locationId}` : '/kiosk')
  }

  const supabase = createServiceClient()

  const [{ data: location }, { data: students }] = await Promise.all([
    supabase.from('locations').select('name, org_id').eq('id', locationId).single(),
    supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .eq('location_id', locationId)
      .order('first_name', { ascending: true }),
  ])

  const settings = location ? await getOrgDisplaySettings(location.org_id) : DEFAULT_ORG_SETTINGS

  return (
    <KioskClient
      locationId={locationId}
      locationName={location?.name ?? ''}
      initialStudents={students ?? []}
      initialHideCheckedIn={settings.kiosk_hide_checked_in}
      initialShowCount={settings.kiosk_show_student_count}
    />
  )
}
