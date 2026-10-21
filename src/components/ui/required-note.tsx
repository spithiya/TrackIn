import { cn } from '@/lib/utils'

// Shown at the top of any form section that marks required fields with *.
export function RequiredNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-slate-500', className)}>
      Fields marked with <span className="font-semibold text-red-500">*</span> are required.
    </p>
  )
}
