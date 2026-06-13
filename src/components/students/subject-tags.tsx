import { Badge } from '@/components/ui/badge'
import { SUBJECTS } from '@/lib/constants'

interface SubjectTagsProps {
  subjects: 'math' | 'reading' | 'both'
}

export function SubjectTags({ subjects }: SubjectTagsProps) {
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
