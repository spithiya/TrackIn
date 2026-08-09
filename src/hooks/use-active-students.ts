'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Views } from '@/lib/supabase/types'

export function useActiveStudents(orgId: string | null, locationIds: string[] = [], assignedStaffId?: string | null) {
  const [students, setStudents] = useState<Views<'active_students'>[]>([])
  const [loading, setLoading] = useState(true)

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
      .channel('active_students')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_checkins', filter: `org_id=eq.${orgId}` },
        () => fetchStudents()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetchStudents])

  return { students, loading, refetch: fetchStudents }
}
