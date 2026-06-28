'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

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
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D65F2] focus:border-transparent"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D65F2] focus:border-transparent'

export default function ForgotPasswordPage() {
  const router = useRouter()

  // Step 1 — identifier
  const [identifier, setIdentifier] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [identifierError, setIdentifierError] = useState<string | null>(null)

  // Step 2 — new password (email is remembered from step 1)
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    setIdentifierError(null)

    const res = await fetch('/api/auth/verify-identifier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() }),
    })
    const json = await res.json()

    if (!res.ok) {
      setIdentifierError(json.error ?? 'Account not found.')
      setVerifying(false)
      return
    }

    setResolvedEmail(json.email)
    setVerifying(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError(null)

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters.')
      return
    }

    setResetting(true)

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resolvedEmail, newPassword }),
    })
    const json = await res.json()

    if (!res.ok) {
      setResetError(json.error ?? 'Failed to reset password.')
      setResetting(false)
      return
    }

    router.push('/auth/login?message=password_changed')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Reset Password</h1>
          <p className="text-sm text-gray-500">
            {resolvedEmail ? 'Set your new password below.' : 'Enter your email or username to get started.'}
          </p>
        </div>

        {/* Step 1 — Identify the account */}
        {!resolvedEmail && (
          <form onSubmit={handleVerify} className="space-y-4">
            {identifierError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{identifierError}</p>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email or Username</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@example.com or username"
                required
                autoFocus
                autoComplete="username"
                className={inputCls}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={verifying}>
              {verifying ? 'Looking up account…' : 'Continue'}
            </Button>
          </form>
        )}

        {/* Step 2 — Set new password */}
        {resolvedEmail && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">
                Account found for <span className="font-semibold">{resolvedEmail}</span>
              </p>
            </div>

            {resetError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{resetError}</p>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat new password"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={resetting}>
              {resetting ? 'Changing password…' : 'Change Password'}
            </Button>

            <button
              type="button"
              onClick={() => { setResolvedEmail(null); setNewPassword(''); setConfirmPassword(''); setResetError(null) }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
            >
              Use a different account
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
