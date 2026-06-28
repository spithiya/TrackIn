import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D65F2] disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-[#0D65F2] text-white hover:bg-[#0B52C7]': variant === 'primary',
            'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'text-[#0F172A] hover:bg-gray-100': variant === 'ghost',
            'border border-[#0D65F2] text-[#0D65F2] hover:bg-[#EFF6FF]': variant === 'outline',
            'text-xs px-2.5 py-1.5': size === 'sm',
            'text-sm px-4 py-2': size === 'md',
            'text-base px-5 py-2.5': size === 'lg',
            'text-lg px-8 py-4 min-h-[56px]': size === 'xl',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
