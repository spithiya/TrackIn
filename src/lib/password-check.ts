import { createHash, randomInt } from 'crypto'

export const BREACHED_PASSWORD_ERROR =
  'This password has appeared in a known data breach. Please choose a different one.'

// Supabase's "leaked password protection" only covers passwords users set
// through its client API, but TrackIn sets nearly all of them through the
// admin API (signup, staff registration, settings, kiosk), which skips it.
// This runs the same Have I Been Pwned check: only the first 5 hex chars
// of the password's SHA-1 leave the server (k-anonymity), never the
// password. Fails open — an outage at HIBP shouldn't block signups.
export async function isBreachedPassword(password: string): Promise<boolean> {
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Padding hides how many real matches the prefix has; padded
      // entries come back with a count of 0.
      headers: { 'Add-Padding': 'true' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return false

    const body = await res.text()
    return body.split('\n').some(line => {
      const [candidate, count] = line.trim().split(':')
      return candidate === suffix && Number(count) > 0
    })
  } catch {
    return false
  }
}

// Each kiosk login starts with its own random password — a shared default
// would let anyone who learned it sign in to any center's kiosk. The owner
// sees it in Settings and may keep it, so it's built to be typed on a
// tablet: three groups of four, without look-alikes (0/O, 1/l/I).
// 12 characters from 57 symbols is ~70 bits.
const KIOSK_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export function generateKioskPassword(): string {
  const chars = Array.from({ length: 12 }, () => KIOSK_PASSWORD_ALPHABET[randomInt(KIOSK_PASSWORD_ALPHABET.length)])
  return [0, 4, 8].map(i => chars.slice(i, i + 4).join('')).join('-')
}
