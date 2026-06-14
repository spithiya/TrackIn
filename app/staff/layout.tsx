import Link from 'next/link'
import { LayoutDashboard, UserCheck, Clock, FileText } from 'lucide-react'
import { SignOutButton } from './sign-out-button'

const nav = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/checkin', label: 'Check In/Out', icon: UserCheck },
  { href: '/staff/my-checkin', label: 'My Check-in', icon: Clock },
  { href: '/staff/my-timesheet', label: 'My Timesheet', icon: FileText },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-[#0D9488]">BrightMind</span>
          <p className="text-xs text-gray-500 mt-0.5">Staff Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
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
        <div className="px-3 py-4 border-t border-gray-100">
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">Staff Portal</span>
          {/* TODO: user menu */}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
