import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

export default async function OwnerSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, email, username, phone')
    .eq('id', user.id)
    .single()

  // A failed query (e.g. a schema mismatch) is not the same as "not
  // logged in" — don't silently bounce an authenticated owner back to
  // the login screen with no explanation.
  if (error || !profile) {
    return (
      <div className="max-w-lg">
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          Couldn&apos;t load your profile settings. Please try again shortly.
        </p>
      </div>
    )
  }

  return <SettingsClient profile={profile} />
}
