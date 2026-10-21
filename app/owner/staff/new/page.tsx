import { createClient } from '@/lib/supabase/server'
import { RegisterStaffForm } from './register-staff-form'
import { requireOwner } from '@/lib/permissions'

export default async function RegisterStaffPage() {
  const access = await requireOwner()
  const supabase = await createClient()

  const { count } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', access.orgId)
    .eq('is_active', true)

  return <RegisterStaffForm hasLocation={(count ?? 0) > 0} />
}
