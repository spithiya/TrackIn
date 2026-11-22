'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileInfo, updateAccountSecurity, updateKioskPassword, updateKioskUsername, deleteMyAccount, updateOrgSettings } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Toast } from '@/components/ui/toast'
import { RequiredNote } from '@/components/ui/required-note'
import { Eye, EyeOff, User, ShieldCheck, Tablet, MonitorPlay, AlertTriangle } from 'lucide-react'
import { SettingsLayout, SettingsSection, ToggleRow, useSettingsTab, type SettingsGroup } from '@/components/settings/settings-layout'
import type { OrgDisplaySettings } from '@/lib/org-settings'

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
  defaultPassword: string | null
}

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

const GROUPS: SettingsGroup[] = [
  {
    label: 'Account',
    tabs: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'security', label: 'Account & Security', icon: ShieldCheck },
    ],
  },
  {
    label: 'Center',
    tabs: [
      { id: 'kiosk', label: 'Kiosk', icon: Tablet },
      { id: 'live', label: 'Live Display', icon: MonitorPlay },
    ],
  },
  { tabs: [{ id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true }] },
]

export function SettingsClient({
  profile,
  kioskAccounts,
  orgSettings,
}: {
  profile: Profile
  kioskAccounts: KioskAccount[]
  orgSettings: OrgDisplaySettings
}) {
  const router = useRouter()
  const [toast, setToast] = useState<ToastState>(null)
  const [tab, setTab] = useSettingsTab(GROUPS)

  // Center preferences — saved the moment a toggle flips
  const [prefs, setPrefs] = useState(orgSettings)
  const [savingPref, setSavingPref] = useState<keyof OrgDisplaySettings | null>(null)

  async function savePref(key: keyof OrgDisplaySettings, value: boolean) {
    const previous = prefs
    setPrefs(p => ({ ...p, [key]: value }))
    setSavingPref(key)
    const result = await updateOrgSettings({ [key]: value })
    setSavingPref(null)
    if (result.error) {
      setPrefs(previous)
      setToast({ message: result.error, variant: 'red' })
    } else {
      setToast({ message: 'Setting saved.', variant: 'green' })
    }
  }

  const [revealedKioskId, setRevealedKioskId] = useState<string | null>(null)

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
      router.refresh()
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
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      <SettingsLayout groups={GROUPS} active={tab} onChange={setTab}>
        {tab === 'profile' && (
          <SettingsSection title="Profile" description="Your name and contact number.">
            <form onSubmit={handleSaveProfile}>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <RequiredNote />
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
          </SettingsSection>
        )}

        {tab === 'security' && (
          <SettingsSection title="Account & Security" description="Your sign-in username, email, and password.">
            <form onSubmit={handleSaveAccount}>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <RequiredNote />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Username *</label>
                      <Input required value={username} onChange={e => setUsername(e.target.value)} onClear={() => setUsername('')} />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Email *</label>
                      <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} onClear={() => setEmail('')} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">New Password</label>
                      <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Leave blank to keep current" />
                    </div>
                    {newPassword && (
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Confirm New Password *</label>
                        <PasswordInput value={confirmNewPassword} onChange={setConfirmNewPassword} placeholder="Repeat new password" />
                      </div>
                    )}
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
          </SettingsSection>
        )}

        {tab === 'kiosk' && (
          <SettingsSection title="Kiosk" description="The front-desk screen students use to check in and out.">
            <Card>
              <CardHeader><CardTitle>Student List</CardTitle></CardHeader>
              <CardContent className="divide-y divide-slate-100">
                <ToggleRow
                  label="Hide checked-in students"
                  description="Checked-in students still appear when they search their name."
                  checked={prefs.kiosk_hide_checked_in}
                  onChange={v => savePref('kiosk_hide_checked_in', v)}
                  disabled={savingPref === 'kiosk_hide_checked_in'}
                />
                <ToggleRow
                  label="Show student count"
                  checked={prefs.kiosk_show_student_count}
                  onChange={v => savePref('kiosk_show_student_count', v)}
                  disabled={savingPref === 'kiosk_show_student_count'}
                />
                <ToggleRow
                  label="Allow live display on the kiosk"
                  description="Adds a button to the kiosk's header that opens the live display in its own tab."
                  checked={prefs.kiosk_live_display_enabled}
                  onChange={v => savePref('kiosk_live_display_enabled', v)}
                  disabled={savingPref === 'kiosk_live_display_enabled'}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Kiosk Login</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">
                  Your kiosk uses its own login, separate from yours, so it can be left
                  signed in on a shared device without exposing your account. New kiosk
                  logins come with a randomly generated password, shown below until you
                  set your own with Change Password.
                </p>
                {!kioskAccounts.length ? (
                  <p className="text-sm text-slate-400">No kiosk account yet.</p>
                ) : (
                  <div className="space-y-3">
                    {kioskAccounts.map(account => (
                      <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 font-mono">{account.username}</p>
                          <p className="text-xs text-slate-400">
                            {account.locationName ? account.locationName : 'Not linked to a location yet'}
                          </p>
                          {account.defaultPassword && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              Password:
                              <span className="font-mono text-slate-700">
                                {revealedKioskId === account.id ? account.defaultPassword : '••••-••••-••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setRevealedKioskId(id => (id === account.id ? null : account.id))}
                                aria-label={revealedKioskId === account.id ? 'Hide password' : 'Show password'}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {revealedKioskId === account.id ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </p>
                          )}
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
          </SettingsSection>
        )}

        {tab === 'live' && (
          <SettingsSection title="Live Display" description="The real-time board of checked-in students, often shown on a wall screen.">
            <Card>
              <CardContent className="pt-6">
                <ToggleRow
                  label="Show parent phone numbers"
                  checked={prefs.live_show_contact_phone}
                  onChange={v => savePref('live_show_contact_phone', v)}
                  disabled={savingPref === 'live_show_contact_phone'}
                />
              </CardContent>
            </Card>
          </SettingsSection>
        )}

        {tab === 'danger' && (
          <SettingsSection title="Danger Zone" danger>
            <Card className="border-red-200">
              <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Delete account</p>
                  <p className="text-sm text-slate-500">Permanently delete your account. This cannot be undone.</p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => { setDeleteOpen(true); setDeletePassword(''); setDeleteConfirmText(''); setDeleteError(null) }}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </SettingsSection>
        )}
      </SettingsLayout>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account">
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <RequiredNote />
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
          <RequiredNote />
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
          <RequiredNote />
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
