'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { updateStudent, toggleStudentActive, addContact, deleteContact, setPrimaryContact, deleteStudent } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubjectTags } from '@/components/students/subject-tags'
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, Copy } from 'lucide-react'
import Link from 'next/link'
import { Toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'

type Student = Tables<'students'>
type Contact = Tables<'parent_contacts'>
type Location = { id: string; name: string }
type Relationship = 'Mother' | 'Father' | 'Guardian' | 'Other'

const RELATIONSHIPS: Relationship[] = ['Mother', 'Father', 'Guardian', 'Other']

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null
type RecentSession = { id: string; checked_in_at: string; checked_out_at: string | null; subjects_snapshot: string; session_note: string | null }

interface NewContactState {
  full_name: string
  relationship: Relationship
  phone: string
  email: string
}

function emptyNewContact(): NewContactState {
  return { full_name: '', relationship: 'Guardian', phone: '', email: '' }
}

export function StudentDetailClient({
  student: initialStudent,
  contacts: initialContacts,
  locations,
}: {
  student: Student
  contacts: Contact[]
  locations: Location[]
  orgId: string
}) {
  const router = useRouter()
  const [student, setStudent] = useState(initialStudent)
  const [contacts, setContacts] = useState(initialContacts)
  const [editingStudent, setEditingStudent] = useState(false)
  const [studentDraft, setStudentDraft] = useState(student)
  const [savingStudent, setSavingStudent] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState<NewContactState>(emptyNewContact())
  const [savingContact, setSavingContact] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const locationMap = Object.fromEntries(locations.map(l => [l.id, l.name]))

  function calcAge(dob: string) {
    const today = new Date()
    const birth = new Date(dob + 'T00:00:00')
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  function formatDob(dob: string) {
    return new Date(dob + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  useEffect(() => {
    if (!editingStudent) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [editingStudent])

  useEffect(() => {
    supabase
      .from('student_checkins')
      .select('id, checked_in_at, checked_out_at, subjects_snapshot, session_note')
      .eq('student_id', student.id)
      .not('checked_out_at', 'is', null)
      .order('checked_in_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentSessions(data ?? []))
  }, [student.id, supabase])

  async function saveStudent() {
    setSavingStudent(true)
    setError(null)
    const result = await updateStudent(student.id, {
      first_name: studentDraft.first_name.trim(),
      last_name: studentDraft.last_name.trim(),
      dob: studentDraft.dob,
      subjects: studentDraft.subjects,
      location_id: studentDraft.location_id,
      notes: studentDraft.notes?.trim() || null,
      is_active: studentDraft.is_active,
    })
    setSavingStudent(false)
    if (result.error) { setError(result.error); return }
    setStudent({ ...student, ...studentDraft })
    setEditingStudent(false)
    setToast({ message: 'Changes saved.', variant: 'green' })
  }

  async function handleToggleActive() {
    const result = await toggleStudentActive(student.id, !student.is_active)
    if (result.error) { setError(result.error); return }
    setStudent(prev => ({ ...prev, is_active: !prev.is_active }))
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteStudent(student.id)
    if (result.error) { setError(result.error); setDeleting(false); return }
    router.push('/owner/students')
  }

  async function handleDeleteContact(id: string) {
    const result = await deleteContact(id)
    if (result.error) { setError(result.error); return }
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  async function handleSetPrimary(id: string) {
    const result = await setPrimaryContact(id, student.id)
    if (result.error) { setError(result.error); return }
    setContacts(prev => prev.map(c => ({ ...c, is_primary: c.id === id })))
  }

  async function saveNewContact() {
    if (!newContact.full_name.trim()) { setError('Contact name is required.'); return }
    setSavingContact(true)
    setError(null)
    const result = await addContact({
      student_id: student.id,
      full_name: newContact.full_name,
      relationship: newContact.relationship,
      phone: newContact.phone,
      email: newContact.email,
    })
    setSavingContact(false)
    if (result.error) { setError(result.error); return }
    // Refresh page to get the full contact row back
    router.refresh()
    setAddingContact(false)
    setNewContact(emptyNewContact())
  }

  function formatDuration(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  async function copyPhone(phone: string) {
    await navigator.clipboard.writeText(phone)
    setCopiedPhone(phone)
    setTimeout(() => setCopiedPhone(null), 2000)
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/owner/students" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          {student.first_name} {student.last_name}
        </h1>
        <Badge variant={student.is_active ? 'green' : 'gray'}>
          {student.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Information</CardTitle>
            {!editingStudent && (
              <button
                onClick={() => { setStudentDraft(student); setEditingStudent(true) }}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingStudent ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">First Name</label>
                  <Input
                    value={studentDraft.first_name}
                    onChange={e => setStudentDraft(p => ({ ...p, first_name: e.target.value }))}
                    onClear={() => setStudentDraft(p => ({ ...p, first_name: '' }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Last Name</label>
                  <Input
                    value={studentDraft.last_name}
                    onChange={e => setStudentDraft(p => ({ ...p, last_name: e.target.value }))}
                    onClear={() => setStudentDraft(p => ({ ...p, last_name: '' }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                <Input
                  type="date"
                  value={studentDraft.dob ?? ''}
                  onChange={e => setStudentDraft(p => ({ ...p, dob: e.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Subjects</label>
                <div className="flex gap-3">
                  {(['math', 'reading', 'both'] as const).map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={studentDraft.subjects === s}
                        onChange={() => setStudentDraft(p => ({ ...p, subjects: s }))}
                        className="accent-blue-600"
                      />
                      <span className="text-sm capitalize">
                        {s === 'both' ? 'Math + Reading' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Location</label>
                <select
                  value={studentDraft.location_id}
                  onChange={e => setStudentDraft(p => ({ ...p, location_id: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Notes</label>
                <div className="relative">
                <textarea
                  value={studentDraft.notes ?? ''}
                  onChange={e => setStudentDraft(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className={`w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${studentDraft.notes ? 'pr-8' : ''}`}
                />
                {studentDraft.notes && (
                  <button type="button" onClick={() => setStudentDraft(p => ({ ...p, notes: '' }))} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveStudent} disabled={savingStudent}>
                  <Check size={14} className="mr-1" />
                  {savingStudent ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingStudent(false)}>
                  <X size={14} className="mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{student.last_name}, {student.first_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Date of Birth</dt>
                <dd className="text-slate-700">
                  {student.dob ? `${formatDob(student.dob)} (age ${calcAge(student.dob)})` : '—'}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Subjects</dt>
                <dd><SubjectTags subjects={student.subjects} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Location</dt>
                <dd className="text-slate-700">{locationMap[student.location_id] ?? '—'}</dd>
              </div>
              {student.notes && (
                <div className="pt-1 border-t border-slate-100">
                  <dt className="text-slate-500 mb-1">Notes</dt>
                  <dd className="text-slate-700 whitespace-pre-wrap">{student.notes}</dd>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleToggleActive}
                  className={`text-sm font-medium transition-colors ${student.is_active ? 'text-amber-500 hover:text-amber-700' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  {student.is_active ? 'Mark as inactive' : 'Mark as active'}
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Delete student
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

      {/* Parent Contacts Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Parent / Guardian Contacts</CardTitle>
            {!addingContact && (
              <button
                onClick={() => setAddingContact(true)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Plus size={15} /> Add contact
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {contacts.length === 0 && !addingContact && (
            <p className="text-sm text-slate-400 text-center py-4">No contacts added yet.</p>
          )}

          {contacts.map(c => (
            <div key={c.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900 text-sm">{c.full_name}</span>
                  <Badge variant="gray">{c.relationship}</Badge>
                  {c.is_primary && <Badge variant="blue">Primary</Badge>}
                </div>
                <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <span>{c.phone}</span>
                      <button type="button" onClick={() => copyPhone(c.phone!)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Copy phone">
                        {copiedPhone === c.phone ? <Check size={12} className="text-blue-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                  {c.email && <div>{c.email}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!c.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(c.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Set primary
                  </button>
                )}
                <button
                  onClick={() => handleDeleteContact(c.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {addingContact && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Contact</p>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Full Name *</label>
                <Input
                  value={newContact.full_name}
                  onChange={e => setNewContact(p => ({ ...p, full_name: e.target.value }))}
                  onClear={() => setNewContact(p => ({ ...p, full_name: '' }))}
                  placeholder="Mary Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Relationship</label>
                  <select
                    value={newContact.relationship}
                    onChange={e => setNewContact(p => ({ ...p, relationship: e.target.value as Relationship }))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <Input
                    type="tel"
                    value={newContact.phone}
                    onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
                    onClear={() => setNewContact(p => ({ ...p, phone: '' }))}
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                  onClear={() => setNewContact(p => ({ ...p, email: '' }))}
                  placeholder="mary@example.com"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveNewContact} disabled={savingContact}>
                  {savingContact ? 'Saving…' : 'Save Contact'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setAddingContact(false); setNewContact(emptyNewContact()) }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {recentSessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.map(s => (
              <div key={s.id} className="text-sm flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(s.checked_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {s.session_note && <p className="text-xs text-slate-500 mt-0.5 italic">{s.session_note}</p>}
                </div>
                <div className="text-right shrink-0">
                  <SubjectTags subjects={s.subjects_snapshot as 'math' | 'reading' | 'both'} />
                  {s.checked_out_at && (
                    <p className="text-xs text-slate-400 mt-1">{formatDuration(s.checked_in_at, s.checked_out_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
