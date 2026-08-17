'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D65F2] focus:border-transparent'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Resolve username → email, same as sign-in — resetPasswordForEmail
    // needs a real email, it doesn't know about our own username column.
    let resolvedEmail = identifier.trim()
    if (!resolvedEmail.includes('@')) {
      const res = await fetch('/api/auth/lookup-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resolvedEmail }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'No account found with that username.')
        setLoading(false)
        return
      }
      resolvedEmail = json.email
    }

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resolvedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })

    if (resetError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
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
            {sent ? 'Check your email for a link to reset your password.' : 'Enter your email or username to get started.'}
          </p>
        </div>

        {sent ? (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              If an account exists for that email or username, we&apos;ve sent a link to reset the password.
              It may take a minute to arrive — check your spam folder too.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
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

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
