'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

export function LocationPicker() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [lastId, setLastId] = useState<string | null>(null)

  useEffect(() => {
    setLastId(getLastLocationId())
    createClient()
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setLocations(data ?? [])
        setLoading(false)
      })
  }, [])

  function select(loc: Location) {
    saveLocationId(loc.id)
    router.push(`/kiosk/${loc.id}`)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!locations.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-lg">No active locations found.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-slate-900 mb-2">Select Your Location</h2>
        <p className="text-slate-500 text-lg">Tap the location for this kiosk.</p>
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
              className={`relative group p-8 rounded-2xl border-2 text-left transition-all shadow-sm active:scale-[0.98] ${
                isLast
                  ? 'border-teal-500 bg-teal-50 shadow-teal-100'
                  : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50 hover:shadow-md'
              }`}
            >
              {isLast && (
                <span className="absolute top-4 right-4 text-xs font-medium text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full">
                  Last used
                </span>
              )}

              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                isLast ? 'bg-teal-200' : 'bg-teal-100 group-hover:bg-teal-200'
              }`}>
                <MapPin size={28} className="text-teal-700" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{loc.name}</h3>

              <p className="text-sm text-slate-500 leading-snug">
                {loc.address_street}<br />
                {loc.address_city}, {loc.address_state} {loc.address_zip}
              </p>

              <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
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
