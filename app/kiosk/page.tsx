import { redirect } from 'next/navigation'
import { requireKioskSession } from '@/lib/kiosk'

// Force per-request rendering: role/session checks need cookies(), so this
// page can never be safely prerendered at build time.
export const dynamic = 'force-dynamic'

export default async function KioskPage() {
  const ctx = await requireKioskSession()

  if (ctx.locationId) redirect(`/kiosk/${ctx.locationId}`)

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <p className="text-gray-500 text-lg text-center max-w-sm">
        This kiosk isn&apos;t linked to a location yet. Ask the owner to add
        your location in the owner portal, then reload this page.
      </p>
    </div>
  )
}
