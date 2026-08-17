import { createClient } from '@/lib/supabase/server'
import { RegisterStaffForm } from './register-staff-form'
import { requireOwner } from '@/lib/permissions'

export default async function RegisterStaffPage() {
  const access = await requireOwner()
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', access.orgId)
    .eq('is_active', true)

  return <RegisterStaffForm locations={locations ?? []} />
}
