import { LoginForm } from './login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">BrightMind staff &amp; owner portal</p>
        <LoginForm urlError={searchParams.error} />
      </div>
    </div>
  )
}
