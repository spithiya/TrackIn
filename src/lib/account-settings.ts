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
