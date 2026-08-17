import { LiveClient } from '../../owner/live/live-client'
import { getLocationFilter } from '@/lib/location-filter'
import { requireAccess } from '@/lib/permissions'

export default async function StaffLivePage() {
  const access = await requireAccess('control_checkin')
  const locationIds = await getLocationFilter()

  return <LiveClient orgId={access.orgId} locationIds={locationIds} />
}
