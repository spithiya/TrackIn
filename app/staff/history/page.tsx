import { HistoryClient } from '../../owner/history/history-client'
import { requireAccess } from '@/lib/permissions'

export default async function StaffHistoryPage() {
  const access = await requireAccess('view_history')

  return <HistoryClient orgId={access.orgId} />
}
