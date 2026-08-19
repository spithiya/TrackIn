import { createAnonClient, createServiceClient } from '@/lib/supabase/server'

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/

export async function verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  const anon = createAnonClient()
  const { error } = await anon.auth.signInWithPassword({ email, password })
  return !error
}

export async function isUsernameTaken(username: string, excludeUserId: string): Promise<boolean> {
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .neq('id', excludeUserId)
    .maybeSingle()
  return !!data
}

// Generates a "kiosk" + 8 random digits username, retrying on the rare
// collision. Used only when a new owner account is created — a kiosk
// login is never regenerated after that.
export async function generateKioskUsername(): Promise<string> {
  const service = createServiceClient()

  for (let attempt = 0; attempt < 20; attempt++) {
    const digits = String(Math.floor(Math.random() * 1e8)).padStart(8, '0')
    const username = `kiosk${digits}`
    const { data } = await service.from('profiles').select('id').ilike('username', username).maybeSingle()
    if (!data) return username
  }

  throw new Error('Could not generate a unique kiosk username.')
}

// Lets one real email be reused across multiple owner accounts (one per
// location). "tag" is always the account's own username, which is already
// globally unique, so the derived address can't collide with anyone else's.
export function deriveTaggedEmail(realEmail: string, tag: string): string | null {
  const at = realEmail.indexOf('@')
  if (at <= 0) return null
  return `${realEmail.slice(0, at)}+${tag}${realEmail.slice(at)}`
}

export function isDuplicateEmailError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'email_exists') return true
  return /already.*(registered|exists)/i.test(error.message ?? '')
}
