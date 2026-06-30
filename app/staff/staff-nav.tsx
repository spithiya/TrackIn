'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UserCheck, Clock, FileText } from 'lucide-react'

const nav = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/checkin', label: 'Check In / Out', icon: UserCheck },
  { href: '/staff/my-checkin', label: 'My Check-in', icon: Clock },
  { href: '/staff/my-timesheet', label: 'My Timesheet', icon: FileText },
]

export function StaffNav() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-[#3B6FD4] text-white font-medium'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
