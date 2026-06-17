import { createServiceClient } from '@/lib/supabase/server'
import { KioskClient } from '../kiosk-client'

export default async function LocationKioskPage({
  params,
}: {
  params: Promise<{ locationId: string }>
}) {
  const { locationId } = await params
  const supabase = createServiceClient()

  const [{ data: location }, { data: students }] = await Promise.all([
    supabase.from('locations').select('name').eq('id', locationId).single(),
    supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .eq('location_id', locationId)
      .order('first_name', { ascending: true }),
  ])

  return (
    <KioskClient
      locationId={locationId}
      locationName={location?.name ?? ''}
      initialStudents={students ?? []}
    />
  )
}
