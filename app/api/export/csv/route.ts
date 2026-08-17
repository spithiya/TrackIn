import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccessContext } from '@/lib/permissions'

export async function GET(request: Request) {
  const supabase = await createClient()

  const access = await getAccessContext()
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!access.permissions.view_history) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get('locationId')
  const studentId = searchParams.get('studentId')
  const period = searchParams.get('period')

  let query = supabase.from('visit_history').select('*')
  if (locationId) query = query.eq('location_id', locationId)
  if (studentId) query = query.eq('student_id', studentId)
  if (period) query = query.gte('checked_in_at', `${period}-01`).lt('checked_in_at', `${period}-32`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ['Student', 'Date', 'Check In', 'Check Out', 'Duration', 'Subjects', 'Note']
  const rows = (data ?? []).map(r => [
    `${r.student_first_name} ${r.student_last_name}`,
    new Date(r.checked_in_at).toLocaleDateString(),
    new Date(r.checked_in_at).toLocaleTimeString(),
    new Date(r.checked_out_at).toLocaleTimeString(),
    `${r.duration_minutes}m`,
    r.subjects_snapshot,
    r.session_note ?? '',
  ])

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="visit-history.csv"`,
    },
  })
}
