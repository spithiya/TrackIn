import { createServiceClient } from '@/lib/supabase/server'
import { LocationPicker } from './location-picker'

export default async function KioskPage() {
  const supabase = createServiceClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return <LocationPicker locations={locations ?? []} />
}
