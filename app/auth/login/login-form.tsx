'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Field, PasswordInput, inputCls } from '../auth-ui'
import { OWNER_SIGNUP_ENABLED } from '@/lib/constants'

// Only the identifier (username/email) is remembered here — never the
// password. That's stored and auto-filled securely by the browser's own
// password manager instead, via the name/autoComplete attributes below
// and offerToSavePassword().
const REMEMBER_KEY = 'trackin_remembered_identifier'

type PasswordCredentialCtor = new (data: { id: string; password: string }) => Credential

// Chrome/Edge expose PasswordCredential, which asks the browser to show its
// "Save password?" prompt directly instead of relying on it guessing that a
// JS-driven sign-in happened. Safari and Firefox don't have it, but pick up
// the sign-in from the form submission on their own.
async function offerToSavePassword(username: string, password: string) {
  const Ctor = (window as unknown as { PasswordCredential?: PasswordCredentialCtor }).PasswordCredential
  if (!Ctor || !navigator.credentials) return
  try {
    await Promise.race([
      navigator.credentials.store(new Ctor({ id: username, password })),
      new Promise(resolve => setTimeout(resolve, 1000)),
    ])
  } catch {
    // Saving is a convenience — never block sign-in on it.
  }
}

export function LoginForm({ urlError, urlMessage }: { urlError?: string; urlMessage?: string }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    urlError === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  )

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setIdentifier(saved)
      setRememberMe(true)
    }
  }, [])

  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Read from the form itself rather than state: browser autofill can fill
    // the inputs without React seeing a change event.
    const form = new FormData(e.currentTarget as HTMLFormElement)
    const username = String(form.get('username') ?? identifier).trim()
    const pw = String(form.get('password') ?? password)
    if (username.includes('@')) {
      setError('Please sign in with your username, not your email address.')
      setLoading(false)
      return
    }

    // Resolve username → the actual Supabase Auth login email
    const res = await fetch('/api/auth/lookup-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'No account found with that username.')
      setLoading(false)
      return
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: json.email,
      password: pw,
    })

    if (signInError) {
      setPassword('')
      setError('Incorrect username or password.')
      setLoading(false)
      return
    }

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, username)
      await offerToSavePassword(username, pw)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, location_id')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'owner') {
      window.location.href = '/owner/dashboard'
    } else if (profile?.role === 'kiosk') {
      window.location.href = profile.location_id ? `/kiosk/${profile.location_id}` : '/kiosk'
    } else {
      window.location.href = '/staff/dashboard'
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-light text-gray-600 mb-6">Sign in</h1>

      <form onSubmit={handleSignIn} className="space-y-5">
        {urlMessage === 'password_changed' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">Password changed successfully. Please sign in.</p>
          </div>
        )}
        {urlMessage === 'account_deleted' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">Your account has been deleted.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <Field label="Username" required>
          <input
            type="text"
            name="username"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="your_username"
            required
            autoComplete="username"
            className={inputCls}
          />
        </Field>

        <Field label="Password" required>
          <PasswordInput name="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0D65F2] focus:ring-[#0D65F2]"
          />
          <span className="text-sm text-gray-600">Remember me</span>
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        {OWNER_SIGNUP_ENABLED && (
          <Link
            href="/auth/signup"
            className="block text-sm text-[#0D65F2] hover:text-blue-700 underline underline-offset-2 transition-colors"
          >
            Don&apos;t have an account?
          </Link>
        )}
        <Link
          href="/auth/forgot-username"
          className="block text-sm text-[#0D65F2] hover:text-blue-700 underline underline-offset-2 transition-colors"
        >
          Forgot username?
        </Link>
        <Link
          href="/auth/forgot-password"
          className="block text-sm text-[#0D65F2] hover:text-blue-700 underline underline-offset-2 transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
