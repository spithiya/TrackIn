'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      // This page only works if you arrived here via the link from
      // resetPasswordForEmail (which establishes a session through
      // /auth/callback) — no valid session means no legitimate way in.
      if (!user) {
        router.replace('/auth/login')
        return
      }
      setAuthorized(true)
      setChecking(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError('Failed to update password. Please try again.')
      setSaving(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/auth/login?message=password_changed')
  }

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Set New Password</h1>
          <p className="text-sm text-gray-500">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" autoComplete="new-password" />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? 'Changing password…' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
