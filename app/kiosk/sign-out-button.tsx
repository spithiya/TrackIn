'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function KioskSignOutButton() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-sm font-medium"
    >
      <LogOut size={16} />
      Sign Out
    </button>
  )
}
