import { createServiceClient } from '@/lib/supabase/server'
import { LocationPicker } from './location-picker'

// Force per-request rendering: without this, Next.js statically prerenders
// this page at build time (nothing here calls cookies()/headers() to imply
// otherwise), baking in whatever locations existed then and requiring a
// working Supabase connection during every build.
export const dynamic = 'force-dynamic'

export default async function KioskPage() {
  const supabase = createServiceClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return <LocationPicker locations={locations ?? []} />
}
