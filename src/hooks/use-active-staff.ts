'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToOrgTable } from '@/lib/supabase/realtime'
import { generateId } from '@/lib/utils'
import type { Views } from '@/lib/supabase/types'

export function useActiveStaff(orgId: string | null, locationIds: string[] = []) {
  const [staff, setStaff] = useState<Views<'active_staff'>[]>([])
  const [loading, setLoading] = useState(true)
  const instanceId = useRef(generateId()).current

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
    return subscribeToOrgTable(`active_staff:${instanceId}`, 'staff_checkins', orgId, fetchStaff)
  }, [orgId, fetchStaff, instanceId])

  return { staff, loading, refetch: fetchStaff }
}
