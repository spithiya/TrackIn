'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Clipboard, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SubjectTags } from '@/components/students/subject-tags'
import { Badge } from '@/components/ui/badge'
import type { Tables } from '@/lib/supabase/types'

type StaffMember = Tables<'staff_members'>
type Location = { id: string; name: string }

export function StaffClient({
  staff,
  locations,
}: {
  staff: StaffMember[]
  locations: Location[]
}) {
  const [query, setQuery] = useState('')

  const locationMap = useMemo(
    () => Object.fromEntries(locations.map(l => [l.id, l.name])),
    [locations]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return staff.filter(
      s =>
        !q ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    )
  }, [staff, query])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Staff Dashboard</h1>
        <Link href="/owner/staff/new">
          <Button size="sm">
            <Clipboard size={15} className="mr-1.5" />
            Register Staff
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">
              {staff.length === 0 ? 'No staff registered yet.' : 'No staff match your search.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Subjects</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{s.last_name}, {s.first_name}</p>
                        {s.email && <p className="text-xs text-slate-400 mt-0.5">{s.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.role_title ?? '—'}</td>
                      <td className="px-4 py-3"><SubjectTags subjects={s.subjects} /></td>
                      <td className="px-4 py-3 text-slate-500">{locationMap[s.location_id] ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.is_active ? 'green' : 'gray'}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">{filtered.length} of {staff.length} staff members</p>
    </div>
  )
}
