import { Card, CardContent } from '@/components/ui/card'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PartnerDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const isUnauthorized = params.message === 'unauthorized_internal'

  return (
    <div className="space-y-4">
      {isUnauthorized && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-medium">
              You are signed in as PARTNER. Internal workspace requires Founder/Director/Staff access.
            </p>
          </CardContent>
        </Card>
      )}
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <p className="text-zo-amber text-lg font-medium">Partner Portal</p>
          <p className="text-sm text-muted-foreground mt-2">Coming soon. You&apos;ll be able to track referrals, commissions, and resources here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
