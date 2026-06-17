'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function KioskBackButton() {
  const pathname = usePathname()
  const href = pathname === '/kiosk' ? '/' : '/kiosk'
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
    >
      <ArrowLeft size={16} />
      Back
    </Link>
  )
}
