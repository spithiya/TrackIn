'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
// Descending so the header defaults near "now" (where the picker opens)
// and scrolling down reaches further into the past — handy for DOB entry
// without clicking through decades of "previous month".
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 121 }, (_, i) => CURRENT_YEAR + 1 - i)

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function parseISO(value: string): { y: number; m: number; d: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) }
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

function formatLabel(value: string): string {
  const parsed = parseISO(value)
  if (!parsed) return ''
  return new Date(parsed.y, parsed.m, parsed.d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Flexible manual entry: "8/18/2026", "8/18/26", "2026-08-18"
function parseTypedDate(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (match) {
    const y = Number(match[1]), m = Number(match[2]), d = Number(match[3])
    return isValidDate(y, m, d) ? toISO(y, m - 1, d) : null
  }
  match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (match) {
    let y = Number(match[3])
    if (y < 100) y += 2000
    const m = Number(match[1]), d = Number(match[2])
    return isValidDate(y, m, d) ? toISO(y, m - 1, d) : null
  }
  return null
}

interface DateInputProps {
  value: string // "YYYY-MM-DD", or "" for empty
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function DateInput({ value, onChange, className, placeholder = 'Date' }: DateInputProps) {
  const [text, setText] = useState(value ? formatLabel(value) : '')
  const [open, setOpen] = useState(false)
  const [activePicker, setActivePicker] = useState<'month' | 'year' | null>(null)
  const today = new Date()
  const parsedValue = useMemo(() => parseISO(value), [value])
  const [viewYear, setViewYear] = useState(parsedValue?.y ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsedValue?.m ?? today.getMonth())
  const containerRef = useRef<HTMLDivElement>(null)
  const monthPickerRef = useRef<HTMLDivElement>(null)
  const yearPickerRef = useRef<HTMLDivElement>(null)
  const monthListRef = useRef<HTMLDivElement>(null)
  const yearListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setText(value ? formatLabel(value) : '')
    const p = parseISO(value)
    if (p) { setViewYear(p.y); setViewMonth(p.m) }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // composedPath() is a snapshot taken when the event was dispatched, so
      // it's still accurate even if the clicked element (e.g. a year option)
      // gets unmounted synchronously by its own click handler before this
      // listener runs — e.target.isConnected / contains() would wrongly
      // read as "outside" in that case since the node is already detached.
      const path = e.composedPath()
      if (containerRef.current && !path.includes(containerRef.current)) {
        setOpen(false)
        setActivePicker(null)
        setText(value ? formatLabel(value) : '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  // Closes the month/year sub-dropdown on an outside click without closing
  // the whole calendar popover — clicking a day/arrow while one is open
  // closes it via their own handlers below.
  useEffect(() => {
    if (!activePicker) return
    function handleClick(e: MouseEvent) {
      const ref = activePicker === 'month' ? monthPickerRef : yearPickerRef
      const path = e.composedPath()
      if (ref.current && !path.includes(ref.current)) {
        setActivePicker(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [activePicker])

  // Scrolls the current selection into view once when a sub-dropdown opens —
  // not on every change, so it doesn't fight a user who's mid-scroll.
  useEffect(() => {
    if (activePicker === 'year' && yearListRef.current) {
      const idx = YEAR_OPTIONS.indexOf(viewYear)
      const el = yearListRef.current.children[idx] as HTMLElement | undefined
      el?.scrollIntoView({ block: 'center' })
    } else if (activePicker === 'month' && monthListRef.current) {
      const el = monthListRef.current.children[viewMonth] as HTMLElement | undefined
      el?.scrollIntoView({ block: 'center' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePicker])

  function openPopover() {
    const p = parseISO(value)
    setViewYear(p?.y ?? today.getFullYear())
    setViewMonth(p?.m ?? today.getMonth())
    setActivePicker(null)
    setOpen(true)
  }

  function selectDay(d: number) {
    const iso = toISO(viewYear, viewMonth, d)
    onChange(iso)
    setText(formatLabel(iso))
    setOpen(false)
    setActivePicker(null)
  }

  function goToday() {
    const iso = toISO(today.getFullYear(), today.getMonth(), today.getDate())
    onChange(iso)
    setText(formatLabel(iso))
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setOpen(false)
    setActivePicker(null)
  }

  function clear() {
    onChange('')
    setText('')
    setOpen(false)
    setActivePicker(null)
  }

  function commitTyped() {
    const parsed = parseTypedDate(text)
    if (parsed) {
      onChange(parsed)
      setText(formatLabel(parsed))
    } else {
      setText(value ? formatLabel(value) : '')
    }
    setOpen(false)
    setActivePicker(null)
  }

  function prevMonth() {
    setActivePicker(null)
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    setActivePicker(null)
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isToday = (d: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate()
  const isSelected = (d: number) =>
    !!parsedValue && parsedValue.y === viewYear && parsedValue.m === viewMonth && parsedValue.d === d

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={text}
          placeholder={placeholder}
          onChange={e => setText(e.target.value)}
          onFocus={openPopover}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitTyped() }
            else if (e.key === 'Escape') {
              setText(value ? formatLabel(value) : '')
              setOpen(false)
              e.currentTarget.blur()
            }
          }}
          className="w-full text-sm border border-slate-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={e => { e.preventDefault(); if (open) setOpen(false); else openPopover() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <CalendarIcon size={14} />
        </button>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); prevMonth() }}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              <div className="relative" ref={monthPickerRef}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); setActivePicker(p => p === 'month' ? null : 'month') }}
                  className="text-sm font-medium text-slate-900 hover:bg-slate-100 rounded px-1.5 py-0.5 transition-colors"
                >
                  {MONTH_LABELS[viewMonth]}
                </button>
                {activePicker === 'month' && (
                  <div
                    ref={monthListRef}
                    className="absolute z-40 mt-1 left-0 w-32 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1"
                  >
                    {MONTH_LABELS.map((label, i) => (
                      <button
                        type="button"
                        key={label}
                        onMouseDown={e => { e.preventDefault(); setViewMonth(i); setActivePicker(null) }}
                        className={cn(
                          'w-full text-left px-3 py-1.5 text-sm transition-colors',
                          i === viewMonth ? 'bg-[#3D4A5C] text-white font-medium' : 'text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={yearPickerRef}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); setActivePicker(p => p === 'year' ? null : 'year') }}
                  className="text-sm font-medium text-slate-900 hover:bg-slate-100 rounded px-1.5 py-0.5 transition-colors"
                >
                  {viewYear}
                </button>
                {activePicker === 'year' && (
                  <div
                    ref={yearListRef}
                    className="absolute z-40 mt-1 left-0 w-20 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1"
                  >
                    {YEAR_OPTIONS.map(y => (
                      <button
                        type="button"
                        key={y}
                        onMouseDown={e => { e.preventDefault(); setViewYear(y); setActivePicker(null) }}
                        className={cn(
                          'w-full text-left px-3 py-1.5 text-sm transition-colors',
                          y === viewYear ? 'bg-[#3D4A5C] text-white font-medium' : 'text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); nextMonth() }}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 place-items-center">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i} className="text-[11px] font-medium text-slate-400">{w}</span>
            ))}
            {cells.map((d, i) => (
              <button
                type="button"
                key={i}
                disabled={d === null}
                onMouseDown={e => { e.preventDefault(); if (d !== null) selectDay(d) }}
                className={cn(
                  'h-7 w-7 text-sm rounded-full transition-colors',
                  d === null && 'invisible',
                  d !== null && !isSelected(d) && !isToday(d) && 'text-slate-700 hover:bg-slate-100',
                  d !== null && isToday(d) && !isSelected(d) && 'text-[#3D4A5C] font-semibold border border-[#3D4A5C]',
                  d !== null && isSelected(d) && 'bg-[#3D4A5C] text-white font-semibold'
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); goToday() }}
              className="text-xs font-medium text-[#3D4A5C] hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); clear() }}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
