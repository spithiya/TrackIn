import { requireAnyAccess } from '@/lib/permissions'
import { MobileSidebarProvider, MobileSidebarFrame, SidebarToggleButton } from '@/components/layout/mobile-sidebar'
import { OwnerNav } from './owner-nav'
import { SignOutButton } from './sign-out-button'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const access = await requireAnyAccess()
  const portalLabel = access.role === 'owner' ? 'Owner Portal' : 'Elevated Access'

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen">
        <MobileSidebarFrame className="w-56 bg-[#252E3D] flex flex-col shrink-0">
          <div className="px-6 py-5 border-b border-white/10">
            <span className="text-lg font-bold text-white">TrackIn</span>
            <p className="text-xs text-white/45 mt-0.5 font-medium tracking-wide uppercase">{portalLabel}</p>
          </div>
          <OwnerNav role={access.role} permissions={access.permissions} />
          <div className="px-3 py-4 border-t border-white/10">
            <SignOutButton />
          </div>
        </MobileSidebarFrame>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-[#CDD2D9] px-4 lg:px-6 py-3.5 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarToggleButton className="text-[#3D4A5C]" />
              <span className="text-sm font-medium text-[#3D4A5C] truncate">{portalLabel}</span>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 bg-[#F5F6F8]">{children}</main>
          <footer className="px-6 py-2.5 border-t border-[#CDD2D9] bg-white text-xs text-gray-400 text-center">
            © 2026 TrackIn. All rights reserved.
          </footer>
        </div>
      </div>
    </MobileSidebarProvider>
  )
}
