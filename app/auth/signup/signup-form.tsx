'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Field, PasswordInput, inputCls } from '../auth-ui'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        username: username.trim(),
        password,
        role: 'owner',
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to create account.')
      setLoading(false)
      return
    }

    // Sign in immediately after successful signup
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.user) {
      setSuccess(true)
      setLoading(false)
      return
    }

    window.location.href = '/owner/dashboard'
  }

  return (
    <div>
      <h1 className="text-4xl font-light text-gray-600 mb-6">Create account</h1>

      <form onSubmit={handleSignUp} className="space-y-5">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Account created! Please{' '}
            <Link href="/auth/login" className="font-semibold underline">
              sign in
            </Link>
            .
          </p>
        )}

        <Field label="Email" required>
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

        <Field label="Username" required>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. trackin_owner"
            required
            autoComplete="off"
            className={inputCls}
          />
          <p className="text-xs text-gray-400 mt-1">3–20 characters. Letters, numbers, _ and - only.</p>
        </Field>

        <Field label="Password" required>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm Password" required>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={loading || success}>
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="text-sm text-[#0D65F2] hover:text-blue-700 underline underline-offset-2 transition-colors"
        >
          Already have an account?
        </Link>
      </div>
    </div>
  )
}
