'use client'

import { useActiveStudents } from '@/hooks/use-active-students'
import { useActiveStaff } from '@/hooks/use-active-staff'
import { MetricCard } from '@/components/ui/metric-card'
import { TimerPill } from '@/components/students/timer-pill'
import { SubjectTags } from '@/components/students/subject-tags'
import { formatTime, fullName } from '@/lib/utils'

export function DashboardClient({
  orgId,
  locationIds,
}: {
  orgId: string
  locationIds: string[]
}) {
  const { students, loading: loadingStudents } = useActiveStudents(orgId, locationIds)
  const { staff, loading: loadingStaff } = useActiveStaff(orgId, locationIds)

  const redCount = students.filter(s => s.timer_status === 'red').length

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard
          label="Students In"
          value={students.length}
          variant={redCount > 0 ? 'red' : students.length > 0 ? 'green' : 'default'}
        />
        <MetricCard
          label="Staff In"
          value={staff.length}
          variant={staff.length > 0 ? 'green' : 'default'}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Active Students</h2>
        {loadingStudents ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">Loading…</div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">No students currently checked in.</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{fullName(s.student_first_name, s.student_last_name)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <SubjectTags subjects={s.subjects_snapshot} />
                    {s.assigned_staff_name && (
                      <span className="text-xs text-gray-400">{s.assigned_staff_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">{formatTime(s.checked_in_at)}</span>
                  <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Staff On Duty</h2>
        {loadingStaff ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">Loading…</div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">No staff currently checked in.</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {staff.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <span className="font-medium text-gray-900">{fullName(s.staff_first_name, s.staff_last_name)}</span>
                <span className="text-xs text-gray-400">{formatTime(s.checked_in_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
