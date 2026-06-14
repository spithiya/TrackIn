import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function minsAgo(n: number) {
  return new Date(Date.now() - n * 60 * 1000).toISOString()
}

async function seed() {
  console.log('Seeding…')

  // Org
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name: 'BrightMind Tutoring' })
    .select()
    .single()
  if (orgErr) { console.error('org:', orgErr.message); process.exit(1) }
  console.log('Created org:', org.id)

  // Location
  const { data: loc, error: locErr } = await supabase
    .from('locations')
    .insert({
      org_id: org.id,
      name: 'Main Campus',
      address_street: '123 Learning Lane',
      address_city: 'Springfield',
      address_state: 'CA',
      address_zip: '90210',
      opens_at: '08:00',
      closes_at: '20:00',
      is_active: true,
    })
    .select()
    .single()
  if (locErr) { console.error('location:', locErr.message); process.exit(1) }
  console.log('Created location:', loc.id)

  // Staff members
  const staffData = [
    { first_name: 'Sarah', last_name: 'Kim', role_title: 'Lead Tutor', subjects: 'both' as const },
    { first_name: 'Marcus', last_name: 'Thompson', role_title: 'Math Tutor', subjects: 'math' as const },
    { first_name: 'Priya', last_name: 'Patel', role_title: 'Reading Tutor', subjects: 'reading' as const },
  ]

  const { data: staffMembers, error: staffErr } = await supabase
    .from('staff_members')
    .insert(staffData.map(s => ({
      org_id: org.id,
      location_id: loc.id,
      ...s,
      is_active: true,
    })))
    .select()
  if (staffErr) { console.error('staff:', staffErr.message); process.exit(1) }
  console.log('Created staff:', staffMembers.map(s => s.first_name))

  // Students
  const studentData = [
    { first_name: 'Emma', last_name: 'Johnson', subjects: 'math' as const },
    { first_name: 'Liam', last_name: 'Chen', subjects: 'both' as const },
    { first_name: 'Sofia', last_name: 'Martinez', subjects: 'reading' as const },
    { first_name: 'Noah', last_name: 'Williams', subjects: 'math' as const },
    { first_name: 'Aisha', last_name: 'Okafor', subjects: 'both' as const },
    { first_name: 'Tyler', last_name: 'Brooks', subjects: 'reading' as const },
  ]

  const { data: students, error: stuErr } = await supabase
    .from('students')
    .insert(studentData.map(s => ({
      org_id: org.id,
      location_id: loc.id,
      ...s,
      is_active: true,
    })))
    .select()
  if (stuErr) { console.error('students:', stuErr.message); process.exit(1) }
  console.log('Created students:', students.map(s => s.first_name))

  // Active staff check-ins (Sarah + Marcus currently clocked in)
  const { error: scErr } = await supabase.from('staff_checkins').insert([
    { org_id: org.id, staff_id: staffMembers[0].id, location_id: loc.id, checked_in_at: minsAgo(135), checked_out_by_owner: false },
    { org_id: org.id, staff_id: staffMembers[1].id, location_id: loc.id, checked_in_at: minsAgo(47), checked_out_by_owner: false },
  ])
  if (scErr) { console.error('staff_checkins:', scErr.message); process.exit(1) }
  console.log('Created staff check-ins')

  // Active student check-ins (4 of 6 students currently in)
  const { error: stcErr } = await supabase.from('student_checkins').insert([
    {
      org_id: org.id,
      student_id: students[0].id,  // Emma - math - 18m (green)
      location_id: loc.id,
      checked_in_at: minsAgo(18),
      subjects_snapshot: 'math',
      time_limit_minutes: 30,
      checkin_method: 'kiosk',
      assigned_staff_id: staffMembers[1].id,
      sms_sent: false,
    },
    {
      org_id: org.id,
      student_id: students[1].id,  // Liam - both - 45m (yellow)
      location_id: loc.id,
      checked_in_at: minsAgo(45),
      subjects_snapshot: 'both',
      time_limit_minutes: 60,
      checkin_method: 'staff',
      assigned_staff_id: staffMembers[0].id,
      checked_in_by_staff_id: staffMembers[0].id,
      sms_sent: false,
    },
    {
      org_id: org.id,
      student_id: students[2].id,  // Sofia - reading - 33m (red)
      location_id: loc.id,
      checked_in_at: minsAgo(33),
      subjects_snapshot: 'reading',
      time_limit_minutes: 30,
      checkin_method: 'kiosk',
      sms_sent: false,
    },
    {
      org_id: org.id,
      student_id: students[3].id,  // Noah - math - 8m (green)
      location_id: loc.id,
      checked_in_at: minsAgo(8),
      subjects_snapshot: 'math',
      time_limit_minutes: 30,
      checkin_method: 'staff',
      assigned_staff_id: staffMembers[2].id,
      checked_in_by_staff_id: staffMembers[2].id,
      sms_sent: false,
    },
  ])
  if (stcErr) { console.error('student_checkins:', stcErr.message); process.exit(1) }
  console.log('Created student check-ins')

  console.log('\nDone! org_id:', org.id)
}

seed()
