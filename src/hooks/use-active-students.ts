'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Views } from '@/lib/supabase/types'

export function useActiveStudents(orgId: string | null) {
  const [students, setStudents] = useState<Views<'active_students'>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStudents = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('active_students')
      .select('*')
      .eq('org_id', orgId)
    setStudents(data ?? [])
    setLoading(false)
  }, [orgId])

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
