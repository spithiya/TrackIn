'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Location = { id: string; name: string }

export function RegisterStaffForm({ orgId, locations }: { orgId: string; locations: Location[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_title: '',
    dob: '',
    subjects: 'math' as 'math' | 'reading' | 'both',
    location_id: locations[0]?.id ?? '',
  })

  function set(key: keyof typeof fields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fields.location_id) { setError('Please select a location.'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('staff_members').insert({
      org_id: orgId,
      first_name: fields.first_name.trim(),
      last_name: fields.last_name.trim(),
      email: fields.email.trim() || null,
      phone: fields.phone.trim() || null,
      role_title: fields.role_title.trim() || null,
      dob: fields.dob || null,
      subjects: fields.subjects,
      location_id: fields.location_id,
      is_active: true,
      profile_id: null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/owner/staff')
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/owner/staff" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Register Staff</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Staff Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">First Name *</label>
                <Input
                  required
                  value={fields.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="Alex"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Last Name *</label>
                <Input
                  required
                  value={fields.last_name}
                  onChange={e => set('last_name', e.target.value)}
                  placeholder="Johnson"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={fields.email}
                onChange={e => set('email', e.target.value)}
                placeholder="alex@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <Input
                  type="tel"
                  value={fields.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+1 555 000 1234"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                <Input
                  type="date"
                  value={fields.dob}
                  onChange={e => set('dob', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Role Title</label>
              <Input
                value={fields.role_title}
                onChange={e => set('role_title', e.target.value)}
                placeholder="e.g. Math Tutor"
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
                      onChange={() => set('subjects', s)}
                      className="accent-teal-600"
                    />
                    <span className="text-sm text-slate-700">
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
                  onChange={e => set('location_id', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || locations.length === 0}>
                {loading ? 'Saving…' : 'Register Staff'}
              </Button>
              <Link href="/owner/staff">
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
