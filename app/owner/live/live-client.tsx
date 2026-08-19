'use client'

import { useActiveStudents } from '@/hooks/use-active-students'
import { useTimerStatus } from '@/hooks/use-timer-status'
import { TimerPill } from '@/components/students/timer-pill'
import { TimerFillBar } from '@/components/students/timer-fill-bar'
import { SubjectTags } from '@/components/students/subject-tags'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { fullName, cn } from '@/lib/utils'
import { Users, Phone } from 'lucide-react'
import type { Views } from '@/lib/supabase/types'

const BORDER_BY_STATUS = {
  green: 'border-l-green-500',
  yellow: 'border-l-amber-500',
  red: 'border-l-red-500',
} as const

function StudentTile({ s }: { s: Views<'active_students'> }) {
  const { status } = useTimerStatus(s.checked_in_at, s.subjects_snapshot)

  return (
    <div className={cn('rounded-lg border border-slate-200 border-l-4 bg-white p-3', BORDER_BY_STATUS[status])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {fullName(s.student_first_name, s.student_last_name)}
        </p>
        <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} className="text-xs px-2 py-0.5 shrink-0" />
      </div>
      <div className="mt-1.5"><SubjectTags subjects={s.subjects_snapshot} /></div>
      <TimerFillBar checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} className="w-full mt-2" />
      {(s.primary_contact_name || s.primary_contact_phone) && (
        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 truncate">
          <Phone size={10} className="shrink-0" />
          <span className="truncate">
            {s.primary_contact_name || s.primary_contact_relationship || 'Contact'}
            {s.primary_contact_phone && ` · ${s.primary_contact_phone}`}
          </span>
        </p>
      )}
    </div>
  )
}

export function LiveClient({ orgId, locationIds = [] }: { orgId: string; locationIds?: string[] }) {
  const { students, loading: loadingStudents } = useActiveStudents(orgId, locationIds)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#252E3D]">Live Display</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-slate-500">Real-time</span>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users size={16} className="text-[#3D4A5C]" />
              Active Students
            </CardTitle>
            <span className="text-sm font-mono font-semibold text-[#3D4A5C] bg-[#ECEEF1] px-2 py-0.5 rounded-full">
              {students.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loadingStudents ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#3D4A5C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No students checked in.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2.5">
              {students.map(s => (
                <StudentTile key={s.id} s={s} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
