'use client'

import { createClient } from '@/lib/supabase/client'

export function StaffPortalButton() {
  async function handleClick() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-2 bg-white rounded-2xl px-10 py-8 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#0D9488] min-w-[200px]"
    >
      <span className="text-4xl">👩‍🏫</span>
      <span className="text-lg font-semibold text-gray-800">Staff Portal</span>
      <span className="text-sm text-gray-500">Dashboard &amp; check-ins</span>
    </button>
  )
}
