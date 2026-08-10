'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Views } from '@/lib/supabase/types'

export function useActiveStaff(orgId: string | null, locationIds: string[] = []) {
  const [staff, setStaff] = useState<Views<'active_staff'>[]>([])
  const [loading, setLoading] = useState(true)
  const instanceId = useRef(crypto.randomUUID()).current

  const fetchStaff = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    let query = supabase.from('active_staff').select('*').eq('org_id', orgId)
    if (locationIds.length > 0) query = query.in('location_id', locationIds)
    const { data } = await query
    setStaff(data ?? [])
    setLoading(false)
  }, [orgId, locationIds.join(',')])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`active_staff:${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_checkins', filter: `org_id=eq.${orgId}` },
        () => fetchStaff()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetchStaff, instanceId])

  return { staff, loading, refetch: fetchStaff }
}
