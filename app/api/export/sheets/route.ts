import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { exportTimesheetToSheets } from '@/src/lib/google-sheets'

export async function POST(request: Request) {
  const { locationId, locationName, period } = await request.json()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_checkins')
    .select('*, staff_members(first_name, last_name)')
    .eq('location_id', locationId)
    .not('checked_out_at', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(r => {
    const staff = r.staff_members as { first_name: string; last_name: string } | null
    return {
      staffName: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown',
      date: new Date(r.checked_in_at).toLocaleDateString(),
      checkIn: new Date(r.checked_in_at).toLocaleTimeString(),
      checkOut: new Date(r.checked_out_at!).toLocaleTimeString(),
      hours: `${((r.duration_minutes ?? 0) / 60).toFixed(2)}h`,
    }
  })

  try {
    const url = await exportTimesheetToSheets(rows, locationName, period)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Sheets export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
