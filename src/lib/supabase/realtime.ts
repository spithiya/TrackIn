import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from './client'

// Subscribes to every insert/update/delete on one table for one org and
// returns a cleanup function for useEffect.
//
// Loads the signed-in user's JWT into Realtime before joining. Otherwise
// the channel can join as anon (supabase-js only pushes the token on
// SIGNED_IN/TOKEN_REFRESHED, not on a cookie-restored INITIAL_SESSION),
// and RLS then silently drops every event.
export function subscribeToOrgTable(
  channelName: string,
  table: string,
  orgId: string,
  onChange: () => void
): () => void {
  const supabase = createClient()
  let channel: RealtimeChannel | null = null
  let cancelled = false

  supabase.realtime.setAuth().then(() => {
    if (cancelled) return
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `org_id=eq.${orgId}` },
        () => onChange()
      )
      .subscribe()
  })

  return () => {
    cancelled = true
    if (channel) supabase.removeChannel(channel)
  }
}
