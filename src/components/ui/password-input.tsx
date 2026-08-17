'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  className?: string
}

export function PasswordInput({ value, onChange, placeholder, autoComplete, className }: PasswordInputProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        autoComplete={autoComplete ?? 'new-password'}
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D65F2] focus:border-transparent',
          className
        )}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}
