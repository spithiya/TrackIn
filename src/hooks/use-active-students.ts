'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'
import type { Views } from '@/lib/supabase/types'

export function useActiveStudents(orgId: string | null, locationIds: string[] = [], assignedStaffId?: string | null) {
  const [students, setStudents] = useState<Views<'active_students'>[]>([])
  const [loading, setLoading] = useState(true)
  // Unique per hook instance — multiple components can call this hook
  // concurrently on the same page, and Supabase reuses an already-subscribed
  // channel if the topic name collides, which throws when a second instance
  // tries to attach its own postgres_changes listener.
  const instanceId = useRef(generateId()).current

  const fetchStudents = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    let query = supabase.from('active_students').select('*').eq('org_id', orgId)
    if (locationIds.length > 0) query = query.in('location_id', locationIds)
    if (assignedStaffId) query = query.eq('assigned_staff_id', assignedStaffId)
    const { data } = await query
    setStudents(data ?? [])
    setLoading(false)
  }, [orgId, locationIds.join(','), assignedStaffId])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`active_students:${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_checkins', filter: `org_id=eq.${orgId}` },
        () => fetchStudents()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetchStudents, instanceId])

  return { students, loading, refetch: fetchStudents }
}
