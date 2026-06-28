'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { UserPlus, Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SubjectTags } from '@/components/students/subject-tags'
import { Badge } from '@/components/ui/badge'
import type { Tables } from '@/lib/supabase/types'

type Student = Tables<'students'>
type Location = { id: string; name: string }
type SortKey = 'name' | 'location'
type SortDir = 'asc' | 'desc'

export function StudentsClient({
  students,
  locations,
}: {
  students: Student[]
  locations: Location[]
}) {
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'math' | 'reading' | 'both'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const locationMap = useMemo(
    () => Object.fromEntries(locations.map(l => [l.id, l.name])),
    [locations]
  )

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="inline ml-1 text-slate-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="inline ml-1 text-blue-600" />
      : <ChevronDown size={13} className="inline ml-1 text-blue-600" />
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const results = students.filter(s => {
      const matchName = !q || s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q)
      const matchSubject = subjectFilter === 'all' || s.subjects === subjectFilter
      return matchName && matchSubject
    })
    return [...results].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
      if (sortKey === 'location') cmp = (locationMap[a.location_id] ?? '').localeCompare(locationMap[b.location_id] ?? '')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [students, query, subjectFilter, sortKey, sortDir, locationMap])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Student Records</h1>
        <Link href="/owner/students/new">
          <Button size="sm">
            <UserPlus size={15} className="mr-1.5" />
            Add Student
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value as typeof subjectFilter)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All subjects</option>
          <option value="math">Math</option>
          <option value="reading">Reading</option>
          <option value="both">Math + Reading</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">
              {students.length === 0 ? 'No students yet. Add one to get started.' : 'No students match your filters.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th
                      className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      Name <SortIcon col="name" />
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Subjects</th>
                    <th
                      className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 transition-colors"
                      onClick={() => toggleSort('location')}
                    >
                      Location <SortIcon col="location" />
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/owner/students/${s.id}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {s.last_name}, {s.first_name}
                      </td>
                      <td className="px-4 py-3">
                        <SubjectTags subjects={s.subjects} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {locationMap[s.location_id] ?? '—'}
                      </td>
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

      <p className="text-xs text-slate-400">{filtered.length} of {students.length} students</p>
    </div>
  )
}
