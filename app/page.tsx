import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col px-8 py-6">

      {/* ── Nav ── */}
      <header className="flex items-center justify-between mb-16">
        <span className="text-xl font-semibold tracking-tight text-[#1a1209]">
          BrightMind<sup className="text-[10px] align-super">®</sup>
        </span>
        <button className="px-5 py-2 rounded-full border border-[#1a1209]/25 bg-white/60 backdrop-blur-sm text-sm font-medium text-[#1a1209] hover:bg-white/80 transition-colors">
          Back to site
        </button>
      </header>

      {/* ── Hero ── */}
      <div className="mb-10 text-center">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#2563EB] mb-4">
          BrightMind Workspace
        </p>
        <h1 className="font-serif text-[3.6rem] leading-[1.05] font-bold text-[#1a1209] mb-5">
          Tutoring Center Management
        </h1>
        <p className="text-[15px] text-[#374151] leading-relaxed max-w-[460px] mx-auto">
          Three surfaces, one system of record. Choose the portal that matches how you&apos;re walking into the center today.
        </p>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Student Kiosk — Gold */}
        <Link
          href="/kiosk"
          className="group bg-white rounded-2xl p-6 flex flex-col min-h-[360px] border border-gray-200 border-t-[3px] border-t-[#2D2D3A] shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-10">
            <div className="w-11 h-11 rounded-xl bg-[#2D2D3A] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="text-[#1a1209]/35 text-base leading-none">↗</span>
          </div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#2D2D3A] mb-2">
            For Students
          </p>
          <h2 className="font-serif text-[1.65rem] font-bold text-[#1a1209] leading-tight mb-3">
            Student Kiosk
          </h2>
          <p className="text-[13px] text-[#374151] leading-relaxed flex-1">
            Self-service check-in and check-out. Search a name, confirm subjects, sit down — under ten seconds, no staff required.
          </p>
          <span className="mt-8 text-[13px] font-medium text-[#1a1209] group-hover:text-[#2D2D3A] transition-colors">
            Open kiosk →
          </span>
        </Link>

        {/* Staff Portal — Slate blue */}
        <Link
          href="/auth/login"
          className="group bg-white rounded-2xl p-6 flex flex-col min-h-[360px] border border-gray-200 border-t-[3px] border-t-[#1B3A6B] shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-10">
            <div className="w-11 h-11 rounded-xl bg-[#1B3A6B] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="text-[#1a1209]/35 text-base leading-none">↗</span>
          </div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#1B3A6B] mb-2">
            For Tutors
          </p>
          <h2 className="font-serif text-[1.65rem] font-bold text-[#1a1209] leading-tight mb-3">
            Staff Portal
          </h2>
          <p className="text-[13px] text-[#374151] leading-relaxed flex-1">
            Live floor view of every student in the building, manual check-ins, and automatic timesheets the front desk used to keep by hand.
          </p>
          <span className="mt-8 text-[13px] font-medium text-[#1a1209] group-hover:text-[#1B3A6B] transition-colors">
            Open staff portal →
          </span>
        </Link>

        {/* Owner Dashboard — Forest green */}
        <Link
          href="/auth/login"
          className="group bg-white rounded-2xl p-6 flex flex-col min-h-[360px] border border-gray-200 border-t-[3px] border-t-[#3D4A5C] shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-10">
            <div className="w-11 h-11 rounded-xl bg-[#3D4A5C] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg>
            </div>
            <span className="text-[#1a1209]/35 text-base leading-none">↗</span>
          </div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#3D4A5C] mb-2">
            For Owners
          </p>
          <h2 className="font-serif text-[1.65rem] font-bold text-[#1a1209] leading-tight mb-3">
            Owner Dashboard
          </h2>
          <p className="text-[13px] text-[#374151] leading-relaxed flex-1">
            Multi-location analytics, payroll-ready exports, and the org-wide metrics you need to actually run the business.
          </p>
          <span className="mt-8 text-[13px] font-medium text-[#1a1209] group-hover:text-[#3D4A5C] transition-colors">
            Open dashboard →
          </span>
        </Link>

      </div>

      <footer className="mt-auto pt-10 pb-6 text-center text-xs text-gray-400">
        © 2026 BrightMind. All rights reserved.
      </footer>
    </div>
  )
}
