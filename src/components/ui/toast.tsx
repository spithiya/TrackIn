'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  variant?: 'green' | 'amber' | 'red'
  onDismiss: () => void
}

export function Toast({ message, variant = 'green', onDismiss }: ToastProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-md text-sm font-medium',
        {
          'bg-green-50 text-green-900 border border-green-200': variant === 'green',
          'bg-amber-50 text-amber-900 border border-amber-200': variant === 'amber',
          'bg-red-50 text-red-900 border border-red-200': variant === 'red',
        }
      )}
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
