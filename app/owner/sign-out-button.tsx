'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function SignOutButton({ variant = 'sidebar' }: { variant?: 'sidebar' | 'header' }) {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  if (variant === 'header') {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-[#3D4A5C] hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
      >
        <LogOut size={15} />
        Sign Out
      </button>
    )
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
