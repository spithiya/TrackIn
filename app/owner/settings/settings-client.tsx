'use client'

import { useState } from 'react'
import { updateProfileInfo, updateAccountSecurity } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'

type Profile = {
  full_name: string
  email: string
  username: string | null
  phone: string | null
}

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

export function SettingsClient({ profile }: { profile: Profile }) {
  const [toast, setToast] = useState<ToastState>(null)

  // Profile info
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Account & security
  const [username, setUsername] = useState(profile.username ?? '')
  const [email, setEmail] = useState(profile.email)
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    const result = await updateProfileInfo({ full_name: fullName, phone })
    if (result.error) {
      setToast({ message: result.error, variant: 'red' })
    } else {
      setToast({ message: 'Profile updated.', variant: 'green' })
    }
    setSavingProfile(false)
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    setSavingAccount(true)
    const result = await updateAccountSecurity({ currentPassword, username, email, newPassword })
    if (result.error) {
      setToast({ message: result.error, variant: 'red' })
    } else {
      setToast({ message: 'Account settings updated.', variant: 'green' })
      setNewPassword('')
      setCurrentPassword('')
    }
    setSavingAccount(false)
  }

  return (
    <div className="max-w-lg space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader><CardTitle>Profile Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Full Name *</label>
              <Input required value={fullName} onChange={e => setFullName(e.target.value)} onClear={() => setFullName('')} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onClear={() => setPhone('')} placeholder="(555) 000-0000" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <form onSubmit={handleSaveAccount}>
        <Card>
          <CardHeader><CardTitle>Account & Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Username *</label>
              <Input required value={username} onChange={e => setUsername(e.target.value)} onClear={() => setUsername('')} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Email *</label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} onClear={() => setEmail('')} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
              </label>
              <PasswordInput value={newPassword} onChange={setNewPassword} />
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <label className="block text-sm font-medium text-slate-700">Current Password *</label>
              <PasswordInput value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="Required to save changes" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingAccount}>
                {savingAccount ? 'Saving…' : 'Save Account Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
