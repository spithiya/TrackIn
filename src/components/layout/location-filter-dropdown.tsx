'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronDown, Check } from 'lucide-react'
import { saveLocationFilter } from '@/lib/filter-action'

type Location = { id: string; name: string }

interface Props {
  locations: Location[]
  selectedIds: string[]
}

export function LocationFilterDropdown({ locations, selectedIds: initialIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(initialIds)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(initialIds)
  }, [initialIds.join(',')])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle(id: string) {
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function confirm() {
    startTransition(async () => {
      await saveLocationFilter(draft)
      setOpen(false)
      router.refresh()
    })
  }

  const label =
    draft.length === 0
      ? 'All Locations'
      : draft.length === locations.length
      ? 'All Locations'
      : `${draft.length} Location${draft.length > 1 ? 's' : ''}`

  const filtered = draft.length > 0 && draft.length < locations.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          filtered
            ? 'border-teal-500 bg-teal-50 text-teal-700'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <MapPin size={14} />
        <span>{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Filter by location</p>
          </div>

          <div className="py-1 max-h-56 overflow-y-auto">
            {locations.map(loc => {
              const checked = draft.includes(loc.id)
              return (
                <button
                  key={loc.id}
                  onClick={() => toggle(loc.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className={`flex-none w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    checked ? 'bg-teal-600 border-teal-600' : 'border-slate-300'
                  }`}>
                    {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  {loc.name}
                </button>
              )
            })}
          </div>

          <div className="px-3 py-2.5 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => setDraft([])}
              className="flex-1 text-xs text-slate-500 hover:text-slate-700 py-1 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={confirm}
              disabled={isPending}
              className="flex-1 bg-teal-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
