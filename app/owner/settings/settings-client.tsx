'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileInfo, updateAccountSecurity, updateKioskPassword, updateKioskUsername, deleteMyAccount } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Toast } from '@/components/ui/toast'

type Profile = {
  full_name: string
  email: string
  username: string | null
  phone: string | null
}

type KioskAccount = {
  id: string
  username: string
  locationName: string | null
}

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

export function SettingsClient({ profile, kioskAccounts }: { profile: Profile; kioskAccounts: KioskAccount[] }) {
  const router = useRouter()
  const [toast, setToast] = useState<ToastState>(null)

  // Kiosk password change
  const [kioskTarget, setKioskTarget] = useState<KioskAccount | null>(null)
  const [kioskNewPassword, setKioskNewPassword] = useState('')
  const [kioskConfirmPassword, setKioskConfirmPassword] = useState('')
  const [savingKioskPassword, setSavingKioskPassword] = useState(false)
  const [kioskPasswordError, setKioskPasswordError] = useState<string | null>(null)

  // Kiosk username change
  const [kioskUsernameTarget, setKioskUsernameTarget] = useState<KioskAccount | null>(null)
  const [kioskNewUsername, setKioskNewUsername] = useState('')
  const [savingKioskUsername, setSavingKioskUsername] = useState(false)
  const [kioskUsernameError, setKioskUsernameError] = useState<string | null>(null)

  // Profile info
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Account & security
  const [username, setUsername] = useState(profile.username ?? '')
  const [email, setEmail] = useState(profile.email)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
    if (newPassword && newPassword !== confirmNewPassword) {
      setToast({ message: 'New passwords do not match.', variant: 'red' })
      return
    }
    setSavingAccount(true)
    const result = await updateAccountSecurity({ currentPassword, username, email, newPassword })
    if (result.error) {
      setToast({ message: result.error, variant: 'red' })
    } else {
      setToast({ message: 'Account settings updated.', variant: 'green' })
      setNewPassword('')
      setConfirmNewPassword('')
      setCurrentPassword('')
    }
    setSavingAccount(false)
  }

  function openKioskPassword(account: KioskAccount) {
    setKioskTarget(account)
    setKioskNewPassword('')
    setKioskConfirmPassword('')
    setKioskPasswordError(null)
  }

  async function handleSaveKioskPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!kioskTarget) return
    if (kioskNewPassword !== kioskConfirmPassword) {
      setKioskPasswordError('Passwords do not match.')
      return
    }
    setSavingKioskPassword(true)
    setKioskPasswordError(null)
    const result = await updateKioskPassword(kioskTarget.id, kioskNewPassword)
    setSavingKioskPassword(false)
    if (result.error) {
      setKioskPasswordError(result.error)
    } else {
      setToast({ message: 'Kiosk password updated.', variant: 'green' })
      setKioskTarget(null)
    }
  }

  function openKioskUsername(account: KioskAccount) {
    setKioskUsernameTarget(account)
    setKioskNewUsername(account.username)
    setKioskUsernameError(null)
  }

  async function handleSaveKioskUsername(e: React.FormEvent) {
    e.preventDefault()
    if (!kioskUsernameTarget) return
    setSavingKioskUsername(true)
    setKioskUsernameError(null)
    const result = await updateKioskUsername(kioskUsernameTarget.id, kioskNewUsername)
    setSavingKioskUsername(false)
    if (result.error) {
      setKioskUsernameError(result.error)
    } else {
      setToast({ message: 'Kiosk username updated.', variant: 'green' })
      setKioskUsernameTarget(null)
      router.refresh()
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    setDeleteError(null)
    setDeleting(true)
    const result = await deleteMyAccount(deletePassword)
    if (result.error) {
      setDeleteError(result.error)
      setDeleting(false)
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login?message=account_deleted')
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
            {newPassword && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Confirm New Password *</label>
                <PasswordInput value={confirmNewPassword} onChange={setConfirmNewPassword} placeholder="Repeat new password" />
              </div>
            )}
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

      <Card>
        <CardHeader><CardTitle>Kiosk Login</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            Your kiosk uses its own login, separate from yours, so it can be left
            signed in on a shared device without exposing your account. The default
            password is <span className="font-mono">12345678</span> until you change it.
          </p>
          {!kioskAccounts.length ? (
            <p className="text-sm text-slate-400">No kiosk account yet.</p>
          ) : (
            <div className="space-y-3">
              {kioskAccounts.map(account => (
                <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 font-mono">{account.username}</p>
                    <p className="text-xs text-slate-400">
                      {account.locationName ? account.locationName : 'Not linked to a location yet'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button type="button" variant="secondary" size="sm" onClick={() => openKioskUsername(account)}>
                      Edit Username
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => openKioskPassword(account)}>
                      Change Password
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-700">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            Permanently delete your account. This cannot be undone.
          </p>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="danger"
              onClick={() => { setDeleteOpen(true); setDeletePassword(''); setDeleteConfirmText(''); setDeleteError(null) }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account">
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <p className="text-sm text-slate-600">
            This permanently deletes your login. For safety, this only works if your
            organization has no staff or students on record yet — otherwise, you&apos;ll
            need to remove those first.
          </p>
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Current Password *</label>
            <PasswordInput value={deletePassword} onChange={setDeletePassword} autoComplete="current-password" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm *
            </label>
            <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} onClear={() => setDeleteConfirmText('')} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword}>
              {deleting ? 'Deleting…' : 'Permanently Delete Account'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!kioskUsernameTarget} onClose={() => setKioskUsernameTarget(null)} title="Edit Kiosk Username">
        <form onSubmit={handleSaveKioskUsername} className="space-y-4">
          <p className="text-sm text-slate-600">
            Currently <span className="font-mono">{kioskUsernameTarget?.username}</span>. Pick something easier to remember.
          </p>
          {kioskUsernameError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{kioskUsernameError}</p>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Username *</label>
            <Input required value={kioskNewUsername} onChange={e => setKioskNewUsername(e.target.value)} onClear={() => setKioskNewUsername('')} />
            <p className="text-xs text-slate-400">3–20 characters. Letters, numbers, _ and - only.</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setKioskUsernameTarget(null)} disabled={savingKioskUsername}>Cancel</Button>
            <Button type="submit" disabled={savingKioskUsername || !kioskNewUsername.trim()}>
              {savingKioskUsername ? 'Saving…' : 'Save Username'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!kioskTarget} onClose={() => setKioskTarget(null)} title="Change Kiosk Password">
        <form onSubmit={handleSaveKioskPassword} className="space-y-4">
          <p className="text-sm text-slate-600">
            Set a new password for <span className="font-mono">{kioskTarget?.username}</span>.
          </p>
          {kioskPasswordError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{kioskPasswordError}</p>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">New Password *</label>
            <PasswordInput value={kioskNewPassword} onChange={setKioskNewPassword} autoComplete="new-password" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Confirm New Password *</label>
            <PasswordInput value={kioskConfirmPassword} onChange={setKioskConfirmPassword} autoComplete="new-password" placeholder="Repeat new password" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setKioskTarget(null)} disabled={savingKioskPassword}>Cancel</Button>
            <Button type="submit" disabled={savingKioskPassword || !kioskNewPassword}>
              {savingKioskPassword ? 'Saving…' : 'Save Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
