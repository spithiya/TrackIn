'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full"
    >
      <LogOut size={16} />
      Sign Out
    </button>
  )
}
