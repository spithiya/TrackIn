import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SignupForm } from './signup-form'

export default function SignupPage() {
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
        <div className="mb-2">
          <h2 className="text-lg font-bold text-[#0F172A]">TrackIn</h2>
          <p className="text-sm text-gray-500">Create your owner account</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
