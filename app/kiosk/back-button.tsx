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
      className="flex items-center gap-1 text-yellow-100 hover:text-white transition-colors text-sm font-medium"
    >
      <ArrowLeft size={16} />
      Back
    </Link>
  )
}
