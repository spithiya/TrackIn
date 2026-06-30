'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateStaff, deleteStaff } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubjectTags } from '@/components/students/subject-tags'
import { ArrowLeft, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Toast } from '@/components/ui/toast'
import type { Tables } from '@/lib/supabase/types'

type StaffMember = Tables<'staff_members'>
type Location = { id: string; name: string }
type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

export function StaffDetailClient({
  member: initialMember,
  locations,
}: {
  member: StaffMember
  locations: Location[]
}) {
  const router = useRouter()
  const [member, setMember] = useState(initialMember)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(member)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const locationMap = Object.fromEntries(locations.map(l => [l.id, l.name]))

  useEffect(() => {
    if (!editing) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [editing])

  async function save() {
    setSaving(true)
    setError(null)
    const extraIds = (draft.location_ids ?? []).filter(id => id !== draft.location_id)
    const result = await updateStaff(member.id, {
      first_name: draft.first_name.trim(),
      last_name: draft.last_name.trim(),
      dob: draft.dob,
      phone: draft.phone?.trim() || null,
      email: draft.email?.trim() || null,
      role_title: draft.role_title?.trim() || null,
      subjects: draft.subjects,
      location_id: draft.location_id,
      location_ids: extraIds.length > 0 ? extraIds : null,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setMember({ ...member, ...draft })
    setEditing(false)
    setToast({ message: 'Changes saved.', variant: 'green' })
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteStaff(member.id)
    if (result.error) { setError(result.error); setDeleting(false); return }
    router.push('/owner/staff')
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/owner/staff" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          {member.first_name} {member.last_name}
        </h1>
        <Badge variant="green">Active</Badge>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Staff Information</CardTitle>
            {!editing && (
              <button
                onClick={() => { setDraft(member); setEditing(true) }}
                className="flex items-center gap-1.5 text-sm text-[#3D4A5C] hover:text-[#252E3D] font-medium transition-colors"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">First Name</label>
                  <Input value={draft.first_name} onChange={e => setDraft(p => ({ ...p, first_name: e.target.value }))} onClear={() => setDraft(p => ({ ...p, first_name: '' }))} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Last Name</label>
                  <Input value={draft.last_name} onChange={e => setDraft(p => ({ ...p, last_name: e.target.value }))} onClear={() => setDraft(p => ({ ...p, last_name: '' }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Role Title</label>
                <Input value={draft.role_title ?? ''} onChange={e => setDraft(p => ({ ...p, role_title: e.target.value }))} onClear={() => setDraft(p => ({ ...p, role_title: '' }))} placeholder="e.g. Math Tutor" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <Input type="tel" value={draft.phone ?? ''} onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))} onClear={() => setDraft(p => ({ ...p, phone: '' }))} placeholder="(555) 000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <Input type="email" value={draft.email ?? ''} onChange={e => setDraft(p => ({ ...p, email: e.target.value }))} onClear={() => setDraft(p => ({ ...p, email: '' }))} placeholder="staff@example.com" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                <Input type="date" value={draft.dob ?? ''} onChange={e => setDraft(p => ({ ...p, dob: e.target.value || null }))} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Subjects</label>
                <div className="flex gap-3">
                  {(['math', 'reading', 'both'] as const).map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={draft.subjects === s} onChange={() => setDraft(p => ({ ...p, subjects: s }))} className="accent-blue-600" />
                      <span className="text-sm">{s === 'both' ? 'Math + Reading' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Primary Location</label>
                <select
                  value={draft.location_id}
                  onChange={e => setDraft(p => ({
                    ...p,
                    location_id: e.target.value,
                    location_ids: (p.location_ids ?? []).filter(id => id !== e.target.value),
                  }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
                >
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              {locations.filter(l => l.id !== draft.location_id).length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Additional Locations{' '}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="space-y-1.5">
                    {locations.filter(l => l.id !== draft.location_id).map(l => {
                      const checked = (draft.location_ids ?? []).includes(l.id)
                      return (
                        <label key={l.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setDraft(p => {
                              const ids = p.location_ids ?? []
                              return {
                                ...p,
                                location_ids: checked
                                  ? ids.filter(id => id !== l.id)
                                  : [...ids, l.id],
                              }
                            })}
                            className="accent-blue-600 rounded"
                          />
                          <span className="text-sm text-slate-700">{l.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={save} disabled={saving}>
                  <Check size={14} className="mr-1" />
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                  <X size={14} className="mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{member.last_name}, {member.first_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Role</dt>
                <dd className="text-slate-700">{member.role_title ?? '—'}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Subjects</dt>
                <dd><SubjectTags subjects={member.subjects} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Location(s)</dt>
                <dd className="text-slate-700 text-right">
                  {[member.location_id, ...(member.location_ids ?? [])]
                    .map(id => locationMap[id])
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-700">{member.phone ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-700">{member.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Date of Birth</dt>
                <dd className="text-slate-700">{member.dob ?? '—'}</dd>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Delete staff member
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Are you sure?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
