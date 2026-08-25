import { LiveClient } from './live-client'
import { requireAccess } from '@/lib/permissions'

export default async function OwnerLivePage() {
  const access = await requireAccess('control_checkin')

  return <LiveClient orgId={access.orgId} />
}
