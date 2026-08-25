import { HistoryClient } from './history-client'
import { requireAccess } from '@/lib/permissions'

export default async function OwnerHistoryPage() {
  const access = await requireAccess('view_history')

  return <HistoryClient orgId={access.orgId} />
}
