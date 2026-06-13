'use client'

import { useEffect, useState } from 'react'
import { getTimerStatus, type TimerStatus } from '@/lib/timer'

export function useTimerStatus(checkedInAt: string, subjects: 'math' | 'reading' | 'both') {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000))
    }, 1000)
    return () => clearInterval(interval)
  }, [checkedInAt])

  const status: TimerStatus = getTimerStatus(elapsed, subjects)
  return { elapsed, status }
}
