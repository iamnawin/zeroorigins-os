import { ComingSoon } from '@/components/internal/coming-soon'
import { BookOpen } from 'lucide-react'

export default function KnowledgePage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Knowledge"
      description="The internal knowledge base for processes, playbooks, and decisions the team relies on."
    />
  )
}
