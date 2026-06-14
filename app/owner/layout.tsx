import Link from 'next/link'
import {
  LayoutDashboard, BarChart2, Monitor, Users, UserPlus,
  History, UserCheck, Clipboard, MapPin, Clock,
} from 'lucide-react'

const nav = [
  { href: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/owner/live', label: 'Live Display', icon: Monitor },
  { href: '/owner/students', label: 'Student Records', icon: Users },
  { href: '/owner/students/new', label: 'Add Student', icon: UserPlus },
  { href: '/owner/history', label: 'Visit History', icon: History },
  { href: '/owner/staff', label: 'Staff Dashboard', icon: UserCheck },
  { href: '/owner/staff/new', label: 'Register Staff', icon: Clipboard },
  { href: '/owner/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/owner/locations', label: 'Locations', icon: MapPin },
]

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-[#0D9488]">BrightMind</span>
          <p className="text-xs text-gray-500 mt-0.5">Owner Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#F0FDFA] hover:text-[#0D9488] transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">Owner Portal</span>
          {/* TODO: user menu */}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
