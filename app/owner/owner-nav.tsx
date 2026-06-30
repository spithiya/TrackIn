'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart2, Monitor, Users, UserPlus,
  History, UserCheck, Clipboard, MapPin, Clock, LogIn,
} from 'lucide-react'

const nav = [
  { href: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/owner/live', label: 'Live Display', icon: Monitor },
  { href: '/owner/checkin', label: 'Check In / Out', icon: LogIn },
  { href: '/owner/students', label: 'Student Records', icon: Users },
  { href: '/owner/students/new', label: 'Add Student', icon: UserPlus },
  { href: '/owner/history', label: 'Visit History', icon: History },
  { href: '/owner/staff', label: 'Staff Dashboard', icon: UserCheck },
  { href: '/owner/staff/new', label: 'Register Staff', icon: Clipboard },
  { href: '/owner/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/owner/locations', label: 'Locations', icon: MapPin },
]

export function OwnerNav() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-[#3D4A5C] text-white font-medium'
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
