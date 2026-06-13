'use client'

import { useEffect, useState } from 'react'
import { getMinutesUntilClose } from '@/lib/timer'
import { CLOSING_WARNING_MINUTES } from '@/lib/constants'

export type ClosingWarningLevel = 'none' | 'amber' | 'red'

export function useClosingWarning(closesAt: string | null) {
  const [level, setLevel] = useState<ClosingWarningLevel>('none')
  const [minutesUntilClose, setMinutesUntilClose] = useState<number>(Infinity)

  useEffect(() => {
    if (!closesAt) return

    function check() {
      const mins = getMinutesUntilClose(closesAt!)
      setMinutesUntilClose(mins)
      if (mins <= 0) setLevel('red')
      else if (mins <= CLOSING_WARNING_MINUTES) setLevel('amber')
      else setLevel('none')
    }

    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [closesAt])

  return { level, minutesUntilClose }
}
