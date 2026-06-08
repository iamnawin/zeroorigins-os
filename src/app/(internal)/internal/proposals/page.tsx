import { ComingSoon } from '@/components/internal/coming-soon'
import { FileText } from 'lucide-react'

export default function ProposalsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Proposals"
      description="Draft, send, and track client proposals through to acceptance. The data layer exists — the proposals workspace UI is being built next."
    />
  )
}
