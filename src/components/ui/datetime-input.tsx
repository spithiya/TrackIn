'use client'

import { TimeInput } from './time-input'
import { cn } from '@/lib/utils'

interface DateTimeInputProps {
  value: string // "YYYY-MM-DDTHH:mm" local, or "" for empty
  onChange: (value: string) => void
  className?: string
}

// Pairs a native date picker (fine as-is) with the custom TimeInput below,
// composed back into the same "YYYY-MM-DDTHH:mm" local string shape a plain
// <input type="datetime-local"> would produce.
export function DateTimeInput({ value, onChange, className }: DateTimeInputProps) {
  const [datePart, timePart] = value ? value.split('T') : ['', '']

  function setDatePart(d: string) {
    if (!d) { onChange(''); return }
    onChange(`${d}T${timePart || '09:00'}`)
  }

  function setTimePart(t: string) {
    const d = datePart || new Date().toISOString().slice(0, 10)
    onChange(`${d}T${t}`)
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <input
        type="date"
        value={datePart}
        onChange={e => setDatePart(e.target.value)}
        className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
      />
      <TimeInput value={timePart} onChange={setTimePart} className="flex-1 min-w-0" />
    </div>
  )
}
