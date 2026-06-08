import { ComingSoon } from '@/components/internal/coming-soon'
import { Building2 } from 'lucide-react'

export default function CustomersPage() {
  return (
    <ComingSoon
      icon={Building2}
      title="Customers"
      description="Manage active customer accounts, their projects, and relationship history. The data layer exists — the customer workspace UI is being built next."
    />
  )
}
