export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEEDFE] px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#534AB7] mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">BrightMind staff &amp; owner portal</p>
        {/* TODO: LoginForm component */}
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          Login form — coming soon
        </div>
      </div>
    </div>
  )
}
