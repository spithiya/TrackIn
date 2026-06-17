'use client'

import { useActiveStudents } from '@/hooks/use-active-students'
import { useActiveStaff } from '@/hooks/use-active-staff'
import { TimerPill } from '@/components/students/timer-pill'
import { SubjectTags } from '@/components/students/subject-tags'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { fullName, formatTime } from '@/lib/utils'
import { Users, UserCheck } from 'lucide-react'

export function LiveClient({ orgId, locationIds = [] }: { orgId: string; locationIds?: string[] }) {
  const { students, loading: loadingStudents } = useActiveStudents(orgId, locationIds)
  const { staff, loading: loadingStaff } = useActiveStaff(orgId, locationIds)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Live Display</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-slate-500">Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users size={16} className="text-teal-600" />
                Active Students
              </CardTitle>
              <span className="text-sm font-mono font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {students.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
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
                    </div>
                    <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCheck size={16} className="text-teal-600" />
                Active Staff
              </CardTitle>
              <span className="text-sm font-mono font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {staff.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStaff ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : staff.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No staff clocked in.</p>
            ) : (
              <div>
                {staff.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {fullName(s.staff_first_name, s.staff_last_name)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Since {formatTime(s.checked_in_at)}</p>
                    </div>
                    <span className="text-sm font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {s.elapsed_minutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
