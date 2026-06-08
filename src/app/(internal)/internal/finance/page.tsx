import { ComingSoon } from '@/components/internal/coming-soon'
import { DollarSign } from 'lucide-react'

export default function FinancePage() {
  return (
    <ComingSoon
      icon={DollarSign}
      title="Finance"
      description="Revenue, invoices, and project profitability tracking. Restricted to leadership — full finance tooling is not built yet."
    />
  )
}
