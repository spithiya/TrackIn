'use client'

import { useActiveStudents } from '@/hooks/use-active-students'
import { TimerPill } from '@/components/students/timer-pill'
import { TimerFillBar } from '@/components/students/timer-fill-bar'
import { SubjectTags } from '@/components/students/subject-tags'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { fullName } from '@/lib/utils'
import { Users, Phone } from 'lucide-react'

export function LiveClient({ orgId, locationIds = [] }: { orgId: string; locationIds?: string[] }) {
  const { students, loading: loadingStudents } = useActiveStudents(orgId, locationIds)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#252E3D]">Live Display</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-slate-500">Real-time</span>
        </div>
      </div>

      <Card>
        <CardHeader>
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
        <CardContent>
          {loadingStudents ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#3D4A5C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No students checked in.</p>
          ) : (
            <div>
              {students.map(s => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {fullName(s.student_first_name, s.student_last_name)}
                    </p>
                    <div className="mt-1"><SubjectTags subjects={s.subjects_snapshot} /></div>
                    {(s.primary_contact_name || s.primary_contact_phone) && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Phone size={11} className="shrink-0" />
                        {s.primary_contact_name || s.primary_contact_relationship || 'Contact'}
                        {s.primary_contact_phone && ` · ${s.primary_contact_phone}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <TimerFillBar checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                    <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
