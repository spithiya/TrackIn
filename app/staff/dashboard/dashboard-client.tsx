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
  staffId,
}: {
  orgId: string
  locationIds: string[]
  staffId: string | null
}) {
  const { students, loading: loadingStudents } = useActiveStudents(orgId, locationIds, staffId)
  const { staff, loading: loadingStaff } = useActiveStaff(orgId, locationIds)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0F2040] mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard
          label="Students In Now"
          value={students.length}
          variant={students.length > 0 ? 'green' : 'default'}
        />
        <MetricCard
          label="Staff Clocked In"
          value={staff.length}
          variant={staff.length > 0 ? 'green' : 'default'}
        />
      </div>

      {/* Active Students */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#0F2040] uppercase tracking-wider mb-3">
          Active Students
        </h2>
        {loadingStudents ? (
          <div className="bg-white rounded-xl border border-[#BECDE8] p-6 text-sm text-gray-400 text-center">
            Loading…
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#BECDE8] p-6 text-sm text-gray-400 text-center">
            No students currently checked in.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#BECDE8] overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] px-5 py-2.5 bg-[#E8EDF7] border-b border-[#BECDE8]">
              <span className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Student</span>
              <span className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Session</span>
            </div>
            <div className="divide-y divide-[#E8EDF7]">
              {students.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-4 hover:bg-[#F0F4FA] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{fullName(s.student_first_name, s.student_last_name)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <SubjectTags subjects={s.subjects_snapshot} />
                      {s.assigned_staff_name && (
                        <span className="text-xs text-gray-400">{s.assigned_staff_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">{formatTime(s.checked_in_at)}</span>
                    <TimerPill checkedInAt={s.checked_in_at} subjects={s.subjects_snapshot} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Staff on Duty */}
      <div>
        <h2 className="text-sm font-semibold text-[#0F2040] uppercase tracking-wider mb-3">
          Staff On Duty
        </h2>
        {loadingStaff ? (
          <div className="bg-white rounded-xl border border-[#BECDE8] p-6 text-sm text-gray-400 text-center">
            Loading…
          </div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#BECDE8] p-6 text-sm text-gray-400 text-center">
            No staff currently checked in.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#BECDE8] overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] px-5 py-2.5 bg-[#E8EDF7] border-b border-[#BECDE8]">
              <span className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Name</span>
              <span className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider">Clocked In</span>
            </div>
            <div className="divide-y divide-[#E8EDF7]">
              {staff.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#F0F4FA] transition-colors">
                  <span className="font-medium text-gray-900">{fullName(s.staff_first_name, s.staff_last_name)}</span>
                  <span className="text-xs text-gray-400">{formatTime(s.checked_in_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
