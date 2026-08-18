'use client'

import { DateInput } from './date-input'
import { TimeInput } from './time-input'
import { cn } from '@/lib/utils'

interface DateTimeInputProps {
  value: string // "YYYY-MM-DDTHH:mm" local, or "" for empty
  onChange: (value: string) => void
  className?: string
  // Restricts the time dropdown's suggestions to this window — see TimeInput.
  minTime?: string
  maxTime?: string
}

// Pairs DateInput with TimeInput, composed back into the same
// "YYYY-MM-DDTHH:mm" local string shape a plain <input type="datetime-local">
// would produce.
export function DateTimeInput({ value, onChange, className, minTime, maxTime }: DateTimeInputProps) {
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
      <DateInput value={datePart} onChange={setDatePart} className="flex-1 min-w-0" />
      <TimeInput
        value={timePart}
        onChange={setTimePart}
        className="flex-1 min-w-0"
        minTime={minTime}
        maxTime={maxTime}
      />
    </div>
  )
}
