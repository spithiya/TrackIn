import { LiveClient } from '../../owner/live/live-client'
import { requireAccess } from '@/lib/permissions'

export default async function StaffLivePage() {
  const access = await requireAccess('control_checkin')

  return <LiveClient orgId={access.orgId} />
}
