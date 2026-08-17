'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const SidebarContext = createContext<{ open: boolean; toggle: () => void; close: () => void } | null>(null)

function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('Sidebar components must be used within MobileSidebarProvider')
  return ctx
}

// Owns open/closed state for the mobile drawer and auto-closes it on
// navigation — otherwise a client-side route change would leave the drawer
// open over the newly loaded page, since the layout (and its DOM state)
// persists across navigations within the same route group.
export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function SidebarToggleButton({ className }: { className?: string }) {
  const { toggle } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle menu"
      className={cn('lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/5 transition-colors shrink-0', className)}
    >
      <Menu size={20} />
    </button>
  )
}

// Renders the sidebar as a permanent, static column on large screens
// (lg: and up — unchanged from the original desktop-only layout), and as
// a slide-in drawer with a dismissible backdrop below that breakpoint.
export function MobileSidebarFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, close } = useSidebar()
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {children}
      </aside>
    </>
  )
}
