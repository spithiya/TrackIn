import { LiveClient } from './live-client'
import { requireAccess } from '@/lib/permissions'
import { getOrgDisplaySettings } from '@/lib/org-settings'

export default async function OwnerLivePage() {
  const access = await requireAccess('control_checkin')
  const settings = await getOrgDisplaySettings(access.orgId)

  return <LiveClient orgId={access.orgId} showContactPhone={settings.live_show_contact_phone} />
}
