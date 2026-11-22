'use client'

import { usePathname } from 'next/navigation'
import { MonitorPlay } from 'lucide-react'

// Every press targets this one named tab, so the browser reuses it rather
// than opening another.
const LIVE_TAB_NAME = 'trackin-live-display'

// Shown in the kiosk header only when the owner allows the live display
// on the kiosk (Settings → Kiosk). The live display opens in its own tab
// (usually the one screen-shared to the room) and stays there while this
// tab keeps doing check-ins.
export function KioskViewSwitch() {
  const pathname = usePathname()

  // The live tab itself is display-only — no switching away from it.
  if (pathname === '/kiosk/live') return null

  function openLiveDisplay() {
    // An empty URL finds the existing live tab without reloading it; only
    // a brand-new (blank) tab gets pointed at the live display.
    const tab = window.open('', LIVE_TAB_NAME)
    if (!tab) return
    if (tab.location.href === 'about:blank') tab.location.href = '/kiosk/live'
    else tab.focus()
  }

  return (
    <button
      type="button"
      onClick={openLiveDisplay}
      className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium"
    >
      <MonitorPlay size={16} />
      Live Display
    </button>
  )
}
