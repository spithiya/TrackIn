'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'
import type { Tables } from '@/lib/supabase/types'

type Location = Tables<'locations'>

const COOKIE = 'bm_kiosk_location'

function getLastLocationId(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^| )' + COOKIE + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

function saveLocationId(id: string) {
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString()
  document.cookie = `${COOKIE}=${encodeURIComponent(id)}; expires=${expires}; path=/; SameSite=Lax`
}

export function LocationPicker({ locations }: { locations: Location[] }) {
  const router = useRouter()
  const posthog = usePostHog()
  const [lastId, setLastId] = useState<string | null>(null)

  useEffect(() => {
    setLastId(getLastLocationId())
  }, [])

  function select(loc: Location) {
    saveLocationId(loc.id)
    posthog.capture('kiosk_location_selected', {
      location_id: loc.id,
      location_name: loc.name,
      was_last_used: lastId === loc.id,
    })
    router.push(`/kiosk/${loc.id}`)
  }

  if (!locations.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 text-lg">No active locations found.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-[#1a1209] mb-2">Select Your Location</h2>
        <p className="text-gray-500 text-lg">Tap the location for this kiosk.</p>
      </div>

      <div className={`grid gap-5 w-full max-w-2xl ${
        locations.length === 1 ? 'grid-cols-1 max-w-sm' :
        locations.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {locations.map(loc => {
          const isLast = lastId === loc.id
          return (
            <button
              key={loc.id}
              onClick={() => select(loc)}
              className="relative group flex flex-col items-start p-8 rounded-2xl border border-gray-200 bg-white text-left shadow-sm hover:shadow-lg hover:-translate-y-2 active:scale-[0.98] transition-all duration-200"
            >
              {isLast && (
                <span className="absolute top-4 right-4 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  Last used
                </span>
              )}

              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-[#F2F2F4] group-hover:bg-[#E5E5EA] transition-colors shrink-0">
                <MapPin size={28} className="text-[#2D2D3A]" />
              </div>

              <h3 className="text-2xl font-bold text-[#1a1209] mb-2 leading-tight">{loc.name}</h3>

              <p className="text-sm text-[#9A8F7E] leading-snug">
                {loc.address_street}<br />
                {loc.address_city}, {loc.address_state} {loc.address_zip}
              </p>

              <div className="flex items-center gap-1.5 mt-3 text-xs text-[#9A8F7E]">
                <Clock size={12} />
                <span>{loc.opens_at} – {loc.closes_at}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
