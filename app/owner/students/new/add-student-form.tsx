'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { addStudent } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'

type Location = { id: string; name: string }
type Relationship = 'Mother' | 'Father' | 'Guardian' | 'Other'

interface ParentContact {
  full_name: string
  relationship: Relationship
  phone: string
  email: string
  is_primary: boolean
}

const RELATIONSHIPS: Relationship[] = ['Mother', 'Father', 'Guardian', 'Other']

function emptyContact(isPrimary = false): ParentContact {
  return { full_name: '', relationship: 'Guardian', phone: '', email: '', is_primary: isPrimary }
}

export function AddStudentForm({ locations, basePath = '/owner' }: { locations: Location[]; basePath?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from a search that came up empty on the check-in page
  // (?first=Jane&last=Smith) — only read once, on mount.
  const [fields, setFields] = useState(() => ({
    first_name: searchParams.get('first') ?? '',
    last_name: searchParams.get('last') ?? '',
    dob: '',
    subjects: 'math' as 'math' | 'reading' | 'both',
    location_id: locations[0]?.id ?? '',
    notes: '',
  }))

  const [contacts, setContacts] = useState<ParentContact[]>([emptyContact(true)])

  function setField(key: keyof typeof fields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function updateContact(index: number, key: keyof ParentContact, value: string | boolean) {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c))
  }

  function setPrimary(index: number) {
    setContacts(prev => prev.map((c, i) => ({ ...c, is_primary: i === index })))
  }

  function addContact() {
    setContacts(prev => [...prev, emptyContact(false)])
  }

  function removeContact(index: number) {
    setContacts(prev => {
      const next = prev.filter((_, i) => i !== index)
      // if we removed the primary, make the first one primary
      if (prev[index].is_primary && next.length > 0) {
        next[0].is_primary = true
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fields.location_id) { setError('Please select a location.'); return }

    const filledContacts = contacts.filter(c => c.full_name.trim() || c.phone.trim())
    const hasPhone = filledContacts.some(c => c.phone.trim())
    if (!hasPhone) { setError('Please add a parent or guardian phone number.'); return }

    setLoading(true)
    setError(null)

    const result = await addStudent({ ...fields, contacts: filledContacts })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(`${basePath}/students`)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`${basePath}/students`} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Add Student</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Student Info */}
        <Card>
          <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">First Name *</label>
                <Input
                  required
                  value={fields.first_name}
                  onChange={e => setField('first_name', e.target.value)}
                  onClear={() => setField('first_name', '')}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Last Name *</label>
                <Input
                  required
                  value={fields.last_name}
                  onChange={e => setField('last_name', e.target.value)}
                  onClear={() => setField('last_name', '')}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
              <Input
                type="date"
                value={fields.dob}
                onChange={e => setField('dob', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Subjects *</label>
              <div className="flex gap-3">
                {(['math', 'reading', 'both'] as const).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="subjects"
                      value={s}
                      checked={fields.subjects === s}
                      onChange={() => setField('subjects', s)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700 capitalize">
                      {s === 'both' ? 'Math + Reading' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Location *</label>
              {locations.length === 0 ? (
                <p className="text-sm text-amber-600">No locations found. Add a location first.</p>
              ) : (
                <select
                  required
                  value={fields.location_id}
                  onChange={e => setField('location_id', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <div className="relative">
              <textarea
                value={fields.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Any notes about this student…"
                rows={3}
                className={`w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C] resize-none ${fields.notes ? 'pr-8' : ''}`}
              />
              {fields.notes && (
                <button type="button" onClick={() => setField('notes', '')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent / Guardian Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Parent / Guardian Contacts</CardTitle>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1.5 text-sm text-[#3D4A5C] hover:text-[#252E3D] font-medium transition-colors"
              >
                <Plus size={15} />
                Add contact
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {contacts.map((contact, i) => (
              <div key={i} className="space-y-3 pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Contact {i + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
                      <input
                        type="radio"
                        name="primary_contact"
                        checked={contact.is_primary}
                        onChange={() => setPrimary(i)}
                        className="accent-blue-600"
                      />
                      Primary
                    </label>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContact(i)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <Input
                      value={contact.full_name}
                      onChange={e => updateContact(i, 'full_name', e.target.value)}
                      onClear={() => updateContact(i, 'full_name', '')}
                      placeholder="Mary Smith"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Relationship</label>
                    <select
                      value={contact.relationship}
                      onChange={e => updateContact(i, 'relationship', e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
                    >
                      {RELATIONSHIPS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Phone *</label>
                    <Input
                      type="tel"
                      value={contact.phone}
                      onChange={e => updateContact(i, 'phone', e.target.value)}
                      onClear={() => updateContact(i, 'phone', '')}
                      placeholder="(555) 000-0000"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={e => updateContact(i, 'email', e.target.value)}
                      onClear={() => updateContact(i, 'email', '')}
                      placeholder="mary@example.com"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || locations.length === 0}>
            {loading ? 'Saving…' : 'Add Student'}
          </Button>
          <Link href={`${basePath}/students`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
