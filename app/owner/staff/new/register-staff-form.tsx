'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type Location = { id: string; name: string }

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        required
        autoComplete="new-password"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3D4A5C] focus:border-transparent"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export function RegisterStaffForm({ locations }: { locations: Location[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
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

    const res = await fetch('/api/owner/register-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: fields.first_name,
        last_name: fields.last_name,
        email: fields.email,
        username: fields.username,
        password: fields.password,
        phone: fields.phone,
        role_title: fields.role_title,
        dob: fields.dob,
        subjects: fields.subjects,
        location_id: fields.location_id,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to register staff.')
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
                <Input required value={fields.first_name} onChange={e => set('first_name', e.target.value)} onClear={() => set('first_name', '')} placeholder="Alex" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Last Name *</label>
                <Input required value={fields.last_name} onChange={e => set('last_name', e.target.value)} onClear={() => set('last_name', '')} placeholder="Johnson" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Email *</label>
              <Input required type="email" value={fields.email} onChange={e => set('email', e.target.value)} onClear={() => set('email', '')} placeholder="alex@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Username *</label>
                <Input required value={fields.username} onChange={e => set('username', e.target.value)} onClear={() => set('username', '')} placeholder="alex_johnson" />
                <p className="text-xs text-slate-400">3–20 chars, letters/numbers/_ -</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Password *</label>
                <PasswordInput value={fields.password} onChange={v => set('password', v)} placeholder="Min. 8 characters" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <Input type="tel" value={fields.phone} onChange={e => set('phone', e.target.value)} onClear={() => set('phone', '')} placeholder="+1 555 000 1234" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                <DateInput value={fields.dob} onChange={v => set('dob', v)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Role Title</label>
              <Input value={fields.role_title} onChange={e => set('role_title', e.target.value)} onClear={() => set('role_title', '')} placeholder="e.g. Math Tutor" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Subjects *</label>
              <div className="flex gap-3">
                {(['math', 'reading', 'both'] as const).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="subjects" value={s} checked={fields.subjects === s} onChange={() => set('subjects', s)} className="accent-blue-600" />
                    <span className="text-sm text-slate-700">{s === 'both' ? 'Math + Reading' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Location *</label>
              {locations.length === 0 ? (
                <p className="text-sm text-amber-600">No locations found. Add a location first.</p>
              ) : (
                <select required value={fields.location_id} onChange={e => set('location_id', e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]">
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || locations.length === 0}>
                {loading ? 'Creating account…' : 'Register Staff'}
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
