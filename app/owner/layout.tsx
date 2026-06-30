import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocationFilter } from '@/lib/location-filter'
import { LocationFilterDropdown } from '@/components/layout/location-filter-dropdown'
import { OwnerNav } from './owner-nav'
import { SignOutButton } from './sign-out-button'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, org_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') redirect('/')

  const [{ data: locations }, selectedIds] = await Promise.all([
    supabase.from('locations').select('id, name').eq('org_id', profile.org_id).order('name'),
    getLocationFilter(),
  ])

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-[#252E3D] flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold text-white">BrightMind</span>
          <p className="text-xs text-white/45 mt-0.5 font-medium tracking-wide uppercase">Owner Portal</p>
        </div>
        <OwnerNav />
        <div className="px-3 py-4 border-t border-white/10">
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#CDD2D9] px-6 py-3.5 flex items-center justify-between">
          <span className="text-sm font-medium text-[#3D4A5C]">Owner Portal</span>
          {locations && locations.length > 0 && (
            <LocationFilterDropdown locations={locations} selectedIds={selectedIds} />
          )}
        </header>
        <main className="flex-1 p-6 bg-[#F5F6F8]">{children}</main>
        <footer className="px-6 py-2.5 border-t border-[#CDD2D9] bg-white text-xs text-gray-400 text-center">
          © 2026 BrightMind. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
