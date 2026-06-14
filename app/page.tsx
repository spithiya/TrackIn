import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#0D9488] mb-2">BrightMind</h1>
        <p className="text-gray-600">Tutoring Center Management</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/kiosk"
          className="flex flex-col items-center gap-2 bg-white rounded-2xl px-10 py-8 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#0D9488] min-w-[200px]"
        >
          <span className="text-4xl">📲</span>
          <span className="text-lg font-semibold text-gray-800">Student Kiosk</span>
          <span className="text-sm text-gray-500">Check in / Check out</span>
        </Link>
        <Link
          href="/staff/dashboard"
          className="flex flex-col items-center gap-2 bg-white rounded-2xl px-10 py-8 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#0D9488] min-w-[200px]"
        >
          <span className="text-4xl">👩‍🏫</span>
          <span className="text-lg font-semibold text-gray-800">Staff Portal</span>
          <span className="text-sm text-gray-500">Dashboard &amp; check-ins</span>
        </Link>
        <Link
          href="/owner/dashboard"
          className="flex flex-col items-center gap-2 bg-white rounded-2xl px-10 py-8 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#0D9488] min-w-[200px]"
        >
          <span className="text-4xl">🏢</span>
          <span className="text-lg font-semibold text-gray-800">Owner Portal</span>
          <span className="text-sm text-gray-500">Analytics &amp; management</span>
        </Link>
      </div>
    </main>
  )
}
