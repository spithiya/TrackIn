import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">BrightMind</h1>
          <p className="text-sm text-gray-500">Staff &amp; owner portal</p>
        </div>
        <LoginForm urlError={error} urlMessage={message} />
      </div>
    </div>
  )
}
