'use client'

import { useTimerStatus } from '@/hooks/use-timer-status'
import { getTimerClasses } from '@/lib/timer'
import { cn } from '@/lib/utils'

interface TimerPillProps {
  checkedInAt: string
  subjects: 'math' | 'reading' | 'both'
  className?: string
}

export function TimerPill({ checkedInAt, subjects, className }: TimerPillProps) {
  const { elapsed, status } = useTimerStatus(checkedInAt, subjects)
  const hours = Math.floor(elapsed / 60)
  const mins = elapsed % 60
  const display = hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}` : `${mins}m`

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-mono font-medium',
        getTimerClasses(status),
        className
      )}
    >
      {display}
    </span>
  )
}
