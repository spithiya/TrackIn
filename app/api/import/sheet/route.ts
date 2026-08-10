import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readSheetRows, getServiceAccountEmail } from '@/lib/google-sheets'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = await getServiceAccountEmail()
  return NextResponse.json({ email })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { url } = await request.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing Google Sheets URL.' }, { status: 400 })
  }

  try {
    const rows = await readSheetRows(url)
    return NextResponse.json({ rows })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const serviceEmail = await getServiceAccountEmail()
    const hint = serviceEmail
      ? ` Make sure the sheet is shared with ${serviceEmail} (Viewer is enough).`
      : ''
    console.error('Sheet import error:', message)
    return NextResponse.json({ error: `Could not read that sheet.${hint}` }, { status: 400 })
  }
}
