import { Badge } from '@/components/ui/badge'
import { SUBJECTS } from '@/lib/constants'

interface SubjectTagsProps {
  subjects: 'math' | 'reading' | 'both' | null
}

export function SubjectTags({ subjects }: SubjectTagsProps) {
  // Staff subjects are optional; students always have one.
  if (!subjects) return <span className="text-slate-400">—</span>
  if (subjects === 'both') {
    return (
      <div className="flex gap-1">
        <Badge variant="purple">Math</Badge>
        <Badge variant="purple">Reading</Badge>
      </div>
    )
  }
  return <Badge variant="purple">{SUBJECTS[subjects]}</Badge>
}
