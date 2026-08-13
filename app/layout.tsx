import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { BackgroundWaves } from './background-waves'
import { PHProvider } from './posthog-provider'
import { PostHogPageView } from './posthog-pageview'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? 'TrackIn Tutoring',
  description: 'Check-in management for tutoring centers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} font-sans antialiased text-[#0F172A]`}>
        <PHProvider>
          <BackgroundWaves />
          <Suspense>
            <PostHogPageView />
          </Suspense>
          {children}
        </PHProvider>
      </body>
    </html>
  )
}
