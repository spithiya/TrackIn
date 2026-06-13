import { TIMER_THRESHOLDS } from './constants'

export type TimerStatus = 'green' | 'yellow' | 'red'

export function getTimerStatus(
  elapsedMinutes: number,
  subjects: 'math' | 'reading' | 'both'
): TimerStatus {
  const thresholds = subjects === 'both' ? TIMER_THRESHOLDS.both : TIMER_THRESHOLDS.single
  if (elapsedMinutes >= thresholds.red) return 'red'
  if (elapsedMinutes >= thresholds.yellow) return 'yellow'
  return 'green'
}

export function getTimerClasses(status: TimerStatus) {
  return {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800 animate-pulse',
  }[status]
}

export function getMinutesUntilClose(closesAt: string): number {
  const now = new Date()
  const [hours, minutes] = closesAt.split(':').map(Number)
  const close = new Date()
  close.setHours(hours, minutes, 0, 0)
  return Math.floor((close.getTime() - now.getTime()) / 60000)
}
