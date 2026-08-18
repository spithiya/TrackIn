'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Every quarter-hour of the day, e.g. ["00:00", "00:15", ..., "23:45"]
const ALL_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4)
  const m = (i % 4) * 15
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

// Accepts flexible free-text entry: "2:30pm", "2:30 PM", "14:30", "1430",
// "2p", "9", "930a" — anything a person would naturally type.
function parseTimeInput(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!s) return null
  const match = s.match(/^(\d{1,2})(?::(\d{2})|(\d{2}))?(am|pm|a|p)?$/)
  if (!match) return null
  let hour = parseInt(match[1], 10)
  const minute = parseInt(match[2] ?? match[3] ?? '0', 10)
  const meridiem = match[4]
  if (minute > 59) return null
  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    const isPm = meridiem.startsWith('p')
    hour = hour % 12
    if (isPm) hour += 12
  } else if (hour > 23) {
    return null
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

interface TimeInputProps {
  value: string // 24-hour "HH:mm", or "" for empty
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  // Restricts the dropdown's suggestion list to this window (inclusive) —
  // typed/free-text entry can still go outside it for the rare exception.
  minTime?: string
  maxTime?: string
}

export function TimeInput({ value, onChange, className, placeholder = 'Time', disabled, minTime, maxTime }: TimeInputProps) {
  const [text, setText] = useState(value ? formatLabel(value) : '')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setText(value ? formatLabel(value) : '')
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setText(value ? formatLabel(value) : '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  const baseSlots = useMemo(() => {
    if (!minTime && !maxTime) return ALL_SLOTS
    const lo = minTime ? minutesOf(minTime) : 0
    const hi = maxTime ? minutesOf(maxTime) : 23 * 60 + 45
    return ALL_SLOTS.filter(slot => {
      const m = minutesOf(slot)
      return m >= lo && m <= hi
    })
  }, [minTime, maxTime])

  const filtered = useMemo(() => {
    const key = text.toLowerCase().replace(/[:\s]/g, '')
    if (!key) return baseSlots
    return baseSlots.filter(slot => formatLabel(slot).toLowerCase().replace(/[:\s]/g, '').startsWith(key))
  }, [text, baseSlots])

  useEffect(() => {
    if (!open || !listRef.current) return
    const idx = highlight >= 0 ? highlight : filtered.indexOf(value)
    const el = listRef.current.children[idx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
    // Only reposition when the dropdown opens or the highlighted row changes —
    // not on every keystroke, so typing doesn't fight the user's scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, highlight])

  function handleSelect(slot: string) {
    onChange(slot)
    setText(formatLabel(slot))
    setOpen(false)
    setHighlight(-1)
  }

  function revert() {
    setText(value ? formatLabel(value) : '')
    setOpen(false)
    setHighlight(-1)
  }

  function commitTyped() {
    const parsed = parseTimeInput(text)
    if (parsed) handleSelect(parsed)
    else revert()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && highlight >= 0 && filtered[highlight]) {
        handleSelect(filtered[highlight])
      } else {
        commitTyped()
      }
    } else if (e.key === 'Escape') {
      revert()
      e.currentTarget.blur()
    } else if (e.key === 'Tab') {
      commitTyped()
    }
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={e => { setText(e.target.value); setOpen(true); setHighlight(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm border border-slate-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C] disabled:opacity-50"
        />
        <Clock size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1"
        >
          {filtered.map((slot, i) => (
            <button
              type="button"
              key={slot}
              onMouseDown={e => { e.preventDefault(); handleSelect(slot) }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-sm transition-colors',
                i === highlight ? 'bg-[#3D4A5C] text-white' : 'text-slate-700 hover:bg-slate-100',
                slot === value && i !== highlight && 'font-semibold text-[#3D4A5C]'
              )}
            >
              {formatLabel(slot)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
