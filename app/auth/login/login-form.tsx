'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Tab = 'signin' | 'signup'

function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D65F2] focus:border-transparent"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D65F2] focus:border-transparent'

export function LoginForm({ urlError, urlMessage }: { urlError?: string; urlMessage?: string }) {
  const [tab, setTab] = useState<Tab>('signin')

  // ── Sign-in state ──
  const [identifier, setIdentifier] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(
    urlError === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  )

  // ── Sign-up state (owners only — staff accounts are created by owners) ──
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSignInLoading(true)
    setSignInError(null)

    // Resolve username → email if the identifier isn't an email address
    let resolvedEmail = identifier.trim()
    if (!resolvedEmail.includes('@')) {
      const res = await fetch('/api/auth/lookup-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resolvedEmail }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSignInError(json.error ?? 'No account found with that username.')
        setSignInLoading(false)
        return
      }
      resolvedEmail = json.email
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password: signInPassword,
    })

    if (error) {
      setSignInPassword('')
      setSignInError('Incorrect email/username or password.')
      setSignInLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    window.location.href = profile?.role === 'owner' ? '/owner/dashboard' : '/staff/dashboard'
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setSignUpError(null)

    if (signUpPassword !== confirmPassword) {
      setSignUpError('Passwords do not match.')
      return
    }
    if (signUpPassword.length < 8) {
      setSignUpError('Password must be at least 8 characters.')
      return
    }

    setSignUpLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        username: username.trim(),
        password: signUpPassword,
        role: 'owner',
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setSignUpError(json.error ?? 'Failed to create account.')
      setSignUpLoading(false)
      return
    }

    // Sign in immediately after successful signup
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: signUpPassword,
    })

    if (error || !data.user) {
      setSignUpSuccess(true)
      setSignUpLoading(false)
      return
    }

    window.location.href = '/owner/dashboard'
  }

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {(['signin', 'signup'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-1.5 text-sm font-medium rounded-md transition-colors',
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t === 'signin' ? 'Sign In' : 'Create Owner Account'}
          </button>
        ))}
      </div>

      {/* ── Sign In ── */}
      {tab === 'signin' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          {urlMessage === 'password_changed' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">Password changed successfully. Please sign in.</p>
            </div>
          )}
          {signInError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{signInError}</p>
          )}

          <Field label="Email or Username">
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="you@example.com or username"
              required
              autoComplete="username"
              className={inputCls}
            />
          </Field>

          <Field label="Password">
            <PasswordInput
              value={signInPassword}
              onChange={setSignInPassword}
              autoComplete="current-password"
            />
            <div className="flex justify-end mt-1">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#0D65F2] hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={signInLoading}>
            {signInLoading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      )}

      {/* ── Create Owner Account ── */}
      {tab === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-4">
          {signUpError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{signUpError}</p>
          )}
          {signUpSuccess && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Account created! Please{' '}
              <button
                type="button"
                onClick={() => { setTab('signin'); setSignUpSuccess(false) }}
                className="font-semibold underline"
              >
                sign in
              </button>
              .
            </p>
          )}

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={inputCls}
            />
          </Field>

          <Field label="Username">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. brightmind_owner"
              required
              autoComplete="off"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">3–20 characters. Letters, numbers, _ and - only.</p>
          </Field>

          <Field label="Password">
            <PasswordInput
              value={signUpPassword}
              onChange={setSignUpPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </Field>

          <Field label="Confirm Password">
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={signUpLoading || signUpSuccess}>
            {signUpLoading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
      )}
    </div>
  )
}
