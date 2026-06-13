import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: number | string
  variant?: 'default' | 'green' | 'yellow' | 'red'
  className?: string
}

export function MetricCard({ label, value, variant = 'default', className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5',
        {
          'border-l-4 border-l-green-500': variant === 'green',
          'border-l-4 border-l-amber-500': variant === 'yellow',
          'border-l-4 border-l-red-500': variant === 'red',
        },
        className
      )}
    >
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 font-mono">{value}</p>
    </div>
  )
}
