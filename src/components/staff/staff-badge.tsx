import { Badge } from '@/components/ui/badge'

interface StaffBadgeProps {
  name: string | null
}

export function StaffBadge({ name }: StaffBadgeProps) {
  if (!name) return null
  return <Badge variant="teal">{name}</Badge>
}
