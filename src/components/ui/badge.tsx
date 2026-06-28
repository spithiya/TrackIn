import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-gray-100 text-gray-700': variant === 'default',
          'bg-green-100 text-green-800': variant === 'green',
          'bg-amber-100 text-amber-800': variant === 'yellow',
          'bg-red-100 text-red-800': variant === 'red',
          'bg-blue-100 text-blue-800': variant === 'blue',
          'bg-[#EFF6FF] text-[#0D65F2]': variant === 'purple',
          'bg-gray-100 text-gray-600': variant === 'gray',
        },
        className
      )}
      {...props}
    />
  )
}
