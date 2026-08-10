'use client'

import { useEffect, useState } from 'react'
import { getTimerStatus, type TimerStatus } from '@/lib/timer'
import { TIME_LIMITS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TimerFillBarProps {
  checkedInAt: string
  subjects: 'math' | 'reading' | 'both'
  className?: string
}

function preciseElapsedMinutes(checkedInAt: string) {
  return (Date.now() - new Date(checkedInAt).getTime()) / 60000
}

export function TimerFillBar({ checkedInAt, subjects, className }: TimerFillBarProps) {
  const [elapsed, setElapsed] = useState(() => preciseElapsedMinutes(checkedInAt))

  useEffect(() => {
    setElapsed(preciseElapsedMinutes(checkedInAt))
    const interval = setInterval(() => setElapsed(preciseElapsedMinutes(checkedInAt)), 1000)
    return () => clearInterval(interval)
  }, [checkedInAt])

  const status: TimerStatus = getTimerStatus(elapsed, subjects)
  const totalMinutes = subjects === 'both' ? TIME_LIMITS.both : TIME_LIMITS.single
  // Once red (time's up or over), show a full bar instead of an empty one —
  // more visible on a room-wide display than a drained-away sliver.
  const fillPercent = status === 'red'
    ? 100
    : Math.max(0, Math.min(100, ((totalMinutes - elapsed) / totalMinutes) * 100))

  return (
    <div
      className={cn('h-3 w-24 rounded-sm bg-black/10 overflow-hidden shrink-0', className)}
      role="progressbar"
      aria-valuenow={Math.round(fillPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full transition-[width] duration-1000 ease-linear', {
          'bg-green-500': status === 'green',
          'bg-amber-500': status === 'yellow',
          'bg-red-500': status === 'red',
        })}
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  )
}
