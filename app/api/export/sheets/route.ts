import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportTimesheetToSheets } from '@/lib/google-sheets'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { locationId, locationName, period, from, to } = await request.json()

  let query = supabase
    .from('staff_checkins')
    .select('*, staff_members(first_name, last_name)')
    .eq('org_id', profile.org_id)
    .eq('location_id', locationId)
    .not('checked_out_at', 'is', null)
    .order('checked_in_at', { ascending: true })

  if (from) query = query.gte('checked_in_at', from)
  if (to) {
    const toDate = new Date(to)
    toDate.setDate(toDate.getDate() + 1)
    query = query.lt('checked_in_at', toDate.toISOString())
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(r => {
    const staff = r.staff_members as unknown as { first_name: string; last_name: string } | null
    return {
      staffName: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown',
      date: new Date(r.checked_in_at).toLocaleDateString(),
      checkIn: new Date(r.checked_in_at).toLocaleTimeString(),
      checkOut: new Date(r.checked_out_at!).toLocaleTimeString(),
      hours: `${((r.duration_minutes ?? 0) / 60).toFixed(2)}h`,
    }
  })

  console.log('Sheets export: GOOGLE_APPLICATION_CREDENTIALS =', process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '(not set)')
  console.log('Sheets export: GOOGLE_SERVICE_ACCOUNT_EMAIL =', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '(not set)')
  console.log('Sheets export: row count =', rows.length)

  try {
    const url = await exportTimesheetToSheets(rows, locationName, period)
    return NextResponse.json({ url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ''
    console.error('Sheets export error:', stack || message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
