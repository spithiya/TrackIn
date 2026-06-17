import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'
import { X } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== ''

    if (!onClear) {
      return (
        <input
          ref={ref}
          value={value}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent disabled:opacity-50',
            className
          )}
          {...props}
        />
      )
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          value={value}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent disabled:opacity-50',
            hasValue && 'pr-8',
            className
          )}
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
