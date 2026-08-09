export const TIME_LIMITS = {
  single: 30,  // minutes — math only or reading only
  both: 60,    // minutes — math + reading
} as const

export const TIMER_THRESHOLDS = {
  single: { yellow: 20, red: 30 },
  both: { yellow: 50, red: 60 },
} as const

export const CLOSING_WARNING_MINUTES = 15

export const KIOSK_RESET_DELAY_MS = 3000

export const SUBJECTS = {
  math: 'Math',
  reading: 'Reading',
  both: 'Math + Reading',
} as const

export const ROLES = {
  owner: 'Owner',
  staff: 'Staff',
} as const

export const CHECKIN_METHODS = {
  kiosk: 'Self (kiosk)',
  staff: 'Staff',
} as const
