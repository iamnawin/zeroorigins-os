import { Card, CardContent } from '@/components/ui/card'

export default function CustomerDashboardPage() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-8 text-center">
        <p className="text-zo-amber text-lg font-medium">Customer Portal</p>
        <p className="text-sm text-muted-foreground mt-2">Coming soon. You&apos;ll be able to track your projects, proposals, and deliverables here.</p>
      </CardContent>
    </Card>
  )
}
