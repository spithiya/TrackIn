'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SettingsTab = { id: string; label: string; icon: LucideIcon; danger?: boolean }
export type SettingsGroup = { label?: string; tabs: SettingsTab[] }

type Accent = 'owner' | 'staff'

const ACCENT: Record<Accent, { heading: string; active: string; activeIcon: string; mobileActive: string }> = {
  owner: {
    heading: 'text-[#252E3D]',
    active: 'bg-white text-[#252E3D] shadow-sm border-slate-200',
    activeIcon: 'text-[#3D4A5C]',
    mobileActive: 'border-[#3D4A5C] text-[#252E3D]',
  },
  staff: {
    heading: 'text-[#0F2040]',
    active: 'bg-white text-[#0F2040] shadow-sm border-[#BECDE8]',
    activeIcon: 'text-[#1B3A6B]',
    mobileActive: 'border-[#1B3A6B] text-[#0F2040]',
  },
}

// The open tab lives in the URL (?tab=kiosk) so it survives a refresh and
// can be linked to directly; anything unrecognized falls back to the first.
export function useSettingsTab(groups: SettingsGroup[]): [string, (id: string) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ids = groups.flatMap(g => g.tabs.map(t => t.id))
  const requested = searchParams.get('tab')
  const active = requested && ids.includes(requested) ? requested : ids[0]

  const setActive = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id === ids[0]) params.delete('tab')
      else params.set('tab', id)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    // ids is derived from groups, which callers define as constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, pathname, searchParams]
  )

  return [active, setActive]
}

// Settings page shell in the style of most web apps: a section nav on the
// left (a scrollable tab strip on small screens) and one section at a time
// on the right.
export function SettingsLayout({
  groups,
  active,
  onChange,
  accent = 'owner',
  children,
}: {
  groups: SettingsGroup[]
  active: string
  onChange: (id: string) => void
  accent?: Accent
  children: React.ReactNode
}) {
  const colors = ACCENT[accent]
  const allTabs = groups.flatMap(g => g.tabs)

  return (
    <div className="space-y-5">
      <h1 className={cn('text-2xl font-semibold', colors.heading)}>Settings</h1>

      {/* Small screens: horizontal tab strip */}
      <nav className="lg:hidden -mx-4 px-4 overflow-x-auto border-b border-slate-200" aria-label="Settings sections">
        <div className="flex gap-1 min-w-max">
          {allTabs.map(tab => {
            const isActive = tab.id === active
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                  isActive
                    ? tab.danger ? 'border-red-500 text-red-700' : colors.mobileActive
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8 items-start">
        {/* Wide screens: vertical section nav */}
        <nav className="hidden lg:block sticky top-6 space-y-5" aria-label="Settings sections">
          {groups.map((group, i) => (
            <div key={group.label ?? i} className="space-y-1">
              {group.label && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
              )}
              {group.tabs.map(tab => {
                const isActive = tab.id === active
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left',
                      isActive
                        ? tab.danger ? 'bg-red-50 text-red-700 border-red-200' : colors.active
                        : cn(
                            'border-transparent hover:bg-white/70',
                            tab.danger ? 'text-red-600 hover:text-red-700' : 'text-slate-600 hover:text-slate-900'
                          )
                    )}
                  >
                    <tab.icon
                      size={16}
                      className={cn(isActive && !tab.danger ? colors.activeIcon : tab.danger ? 'text-red-500' : 'text-slate-400')}
                    />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </div>
  )
}

// One settings section: a heading and short description, then its cards.
export function SettingsSection({
  title,
  description,
  danger,
  children,
}: {
  title: string
  description?: React.ReactNode
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <div className="pb-4 border-b border-slate-200">
        <h2 className={cn('text-lg font-semibold', danger ? 'text-red-700' : 'text-slate-900')}>{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  )
}

// An on/off preference that saves the moment it's flipped.
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: React.ReactNode
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3D4A5C]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-[#3D4A5C]' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}
