import { createServiceClient } from '@/lib/supabase/server'

export type OrgDisplaySettings = {
  kiosk_hide_checked_in: boolean
  live_show_contact_phone: boolean
  kiosk_show_student_count: boolean
  kiosk_live_display_enabled: boolean
}

export const DEFAULT_ORG_SETTINGS: OrgDisplaySettings = {
  kiosk_hide_checked_in: false,
  live_show_contact_phone: true,
  kiosk_show_student_count: true,
  kiosk_live_display_enabled: false,
}

// Callers must already have checked the viewer belongs to orgId — this
// reads with the service role.
export async function getOrgDisplaySettings(orgId: string): Promise<OrgDisplaySettings> {
  const { data } = await createServiceClient()
    .from('organizations')
    .select('kiosk_hide_checked_in, live_show_contact_phone, kiosk_show_student_count, kiosk_live_display_enabled')
    .eq('id', orgId)
    .maybeSingle()
  return data ?? DEFAULT_ORG_SETTINGS
}
