'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart2, Monitor, Users, UserPlus,
  History, UserCheck, Clipboard, MapPin, Clock, LogIn, Settings,
} from 'lucide-react'
import type { Permission } from '@/lib/permissions'

const nav = [
  { href: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: null as Permission | null },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart2, perm: 'view_analytics' as Permission | null },
  { href: '/owner/live', label: 'Live Display', icon: Monitor, perm: 'control_checkin' as Permission | null },
  { href: '/owner/checkin', label: 'Check In / Out', icon: LogIn, perm: 'control_checkin' as Permission | null },
  { href: '/owner/students', label: 'Student Records', icon: Users, perm: 'manage_students' as Permission | null },
  { href: '/owner/students/new', label: 'Add Student', icon: UserPlus, perm: 'manage_students' as Permission | null },
  { href: '/owner/history', label: 'Visit History', icon: History, perm: 'view_history' as Permission | null },
  { href: '/owner/staff', label: 'Staff Dashboard', icon: UserCheck, perm: 'owner-only' as const },
  { href: '/owner/staff/new', label: 'Register Staff', icon: Clipboard, perm: 'owner-only' as const },
  { href: '/owner/timesheets', label: 'Timesheets', icon: Clock, perm: 'owner-only' as const },
  { href: '/owner/locations', label: 'Locations', icon: MapPin, perm: 'owner-only' as const },
  { href: '/owner/settings', label: 'Settings', icon: Settings, perm: 'owner-only' as const },
]

export function OwnerNav({
  role,
  permissions,
}: {
  role: 'owner' | 'staff'
  permissions: Record<Permission, boolean>
}) {
  const pathname = usePathname()
  const visible = nav.filter(item => {
    if (role === 'owner') return true
    if (item.perm === 'owner-only') return false
    if (item.perm === null) return true // dashboard overview — visible to any staff let into this portal
    return permissions[item.perm]
  })
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {visible.map(({ href, label, icon: Icon }) => {
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
