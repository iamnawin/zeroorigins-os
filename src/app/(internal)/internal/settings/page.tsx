import { ComingSoon } from '@/components/internal/coming-soon'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Workspace configuration, team roles, and access management. Restricted to leadership — settings tooling is not built yet."
    />
  )
}
