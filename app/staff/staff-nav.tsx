'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UserCheck, Clock, FileText, Settings,
  Users, History, BarChart2, Monitor,
} from 'lucide-react'
import type { Permission } from '@/lib/permissions'

const nav = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/checkin', label: 'Check In / Out', icon: UserCheck },
  { href: '/staff/my-checkin', label: 'My Check-in', icon: Clock },
  { href: '/staff/my-timesheet', label: 'My Timesheet', icon: FileText },
  { href: '/staff/settings', label: 'Settings', icon: Settings },
]

const ELEVATED_NAV: { perm: Permission; href: string; label: string; icon: typeof Users }[] = [
  { perm: 'manage_students', href: '/owner/students', label: 'Student Records', icon: Users },
  { perm: 'view_history', href: '/owner/history', label: 'Visit History', icon: History },
  { perm: 'view_analytics', href: '/owner/analytics', label: 'Analytics', icon: BarChart2 },
  { perm: 'control_checkin', href: '/owner/live', label: 'Live Display', icon: Monitor },
]

export function StaffNav({ permissions }: { permissions: Record<Permission, boolean> }) {
  const pathname = usePathname()
  const elevated = ELEVATED_NAV.filter(item => permissions[item.perm])

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
                ? 'bg-[#1B3A6B] text-white font-medium'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        )
      })}

      {elevated.length > 0 && (
        <>
          <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-white/35 uppercase tracking-wide">
            Elevated Access
          </p>
          {elevated.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-[#1B3A6B] text-white font-medium'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </>
      )}
    </nav>
  )
}
