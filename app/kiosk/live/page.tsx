import { redirect } from 'next/navigation'
import { requireKioskSession } from '@/lib/kiosk'
import { getOrgDisplaySettings } from '@/lib/org-settings'
import { LiveClient } from '../../owner/live/live-client'

export const dynamic = 'force-dynamic'

// The same Live Display owners and staff see, opened from the kiosk login.
// Only reachable while the owner has it allowed in Settings → Kiosk.
export default async function KioskLivePage() {
  const ctx = await requireKioskSession()
  const settings = await getOrgDisplaySettings(ctx.orgId)
  if (!settings.kiosk_live_display_enabled) redirect('/kiosk')

  return (
    <div className="flex-1 p-4 lg:p-6">
      <LiveClient orgId={ctx.orgId} showContactPhone={settings.live_show_contact_phone} />
    </div>
  )
}
