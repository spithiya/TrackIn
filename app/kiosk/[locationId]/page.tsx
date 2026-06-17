import { KioskClient } from '../kiosk-client'

export default async function LocationKioskPage({
  params,
}: {
  params: Promise<{ locationId: string }>
}) {
  const { locationId } = await params
  return <KioskClient locationId={locationId} />
}
