'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileInfo, updateAccountSecurity, deleteMyAccount } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Toast } from '@/components/ui/toast'

type Profile = { email: string; username: string | null }
type Member = { first_name: string; last_name: string; phone: string | null }

type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

export function SettingsClient({ profile, member }: { profile: Profile; member: Member }) {
  const router = useRouter()
  const [toast, setToast] = useState<ToastState>(null)

  // Profile info
  const [firstName, setFirstName] = useState(member.first_name)
  const [lastName, setLastName] = useState(member.last_name)
  const [phone, setPhone] = useState(member.phone ?? '')
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
    const result = await updateProfileInfo({ first_name: firstName, last_name: lastName, phone })
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

      <h1 className="text-2xl font-semibold text-[#0F2040]">Settings</h1>

      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader><CardTitle>Profile Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <Input required value={firstName} onChange={e => setFirstName(e.target.value)} onClear={() => setFirstName('')} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <Input required value={lastName} onChange={e => setLastName(e.target.value)} onClear={() => setLastName('')} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onClear={() => setPhone('')} placeholder="(555) 000-0000" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile} className="bg-[#1B3A6B] hover:bg-[#122F5E] focus-visible:ring-[#1B3A6B]">
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
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <Input required value={username} onChange={e => setUsername(e.target.value)} onClear={() => setUsername('')} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} onClear={() => setEmail('')} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
              </label>
              <PasswordInput value={newPassword} onChange={setNewPassword} />
            </div>
            {newPassword && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Confirm New Password *</label>
                <PasswordInput value={confirmNewPassword} onChange={setConfirmNewPassword} placeholder="Repeat new password" />
              </div>
            )}
            <div className="pt-2 border-t border-gray-100 space-y-1">
              <label className="block text-sm font-medium text-gray-700">Current Password *</label>
              <PasswordInput value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="Required to save changes" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingAccount} className="bg-[#1B3A6B] hover:bg-[#122F5E] focus-visible:ring-[#1B3A6B]">
                {savingAccount ? 'Saving…' : 'Save Account Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-700">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
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
          <p className="text-sm text-gray-600">
            This permanently deletes your login — you won&apos;t be able to sign in
            afterward. Your historical timesheet and check-in records are kept for
            the business&apos;s records, just no longer tied to an active account.
          </p>
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Current Password *</label>
            <PasswordInput value={deletePassword} onChange={setDeletePassword} autoComplete="current-password" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
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
    </div>
  )
}
