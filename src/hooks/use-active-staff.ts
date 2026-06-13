'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Views } from '@/lib/supabase/types'

export function useActiveStaff(orgId: string | null) {
  const [staff, setStaff] = useState<Views<'active_staff'>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStaff = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('active_staff')
      .select('*')
      .eq('org_id', orgId)
    setStaff(data ?? [])
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()

    const channel = supabase
      .channel('active_staff')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_checkins', filter: `org_id=eq.${orgId}` },
        () => fetchStaff()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetchStaff])

  return { staff, loading, refetch: fetchStaff }
}
