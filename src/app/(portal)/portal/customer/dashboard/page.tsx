import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/sign-out-button'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CustomerDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const isUnauthorized = params.message === 'unauthorized_internal'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id ?? '').single()

  const { count: founderCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['FOUNDER', 'SUPER_ADMIN'])

  const isInternal = INTERNAL_ROLES.includes(profile?.role)
  const noFounderExists = user && (founderCount || 0) === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Role Debug Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Status</CardTitle>
            <SignOutButton variant="ghost" className="h-8 text-xs" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current Role</p>
              <p className="text-sm font-medium text-zo-amber">{profile?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isUnauthorized && (
        <Card className="bg-destructive/10 border-destructive/20 border">
          <CardContent className="p-4 flex flex-col gap-2">
            <p className="text-sm text-destructive font-medium">
              You are signed in as CUSTOMER. Internal workspace requires FOUNDER, DIRECTOR, STAFF, or CONTRACTOR role.
            </p>
            {!isInternal && (
              <p className="text-xs text-muted-foreground">
                If you should have internal access, please contact the system administrator to promote your account.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Stub */}
      <Card className="bg-card border-border">
        <CardContent className="p-12 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-zo-amber text-2xl font-semibold">Customer Portal</p>
            <p className="text-muted-foreground max-w-md mx-auto">
              Coming soon. You&apos;ll be able to track your projects, proposals, and deliverables here.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {isInternal ? (
              <Button className="bg-zo-amber hover:bg-zo-amber/90 text-black px-8">
                <Link href="/internal/control-room">Go to Control Room</Link>
              </Button>
            ) : noFounderExists ? (
              <Button className="bg-zo-amber hover:bg-zo-amber/90 text-black px-8">
                <Link href="/setup-founder">Set up Founder Account</Link>
              </Button>
            ) : (
              <div className="group relative">
                <Button disabled className="px-8">Go to Control Room</Button>
                <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Requires internal role promotion
                </p>
              </div>
            )}
            <Button variant="outline">
              <Link href="/request-build">Request a Build</Link>
            </Button>
            <Button variant="outline">
              <Link href="/partner-with-us">Partner With Us</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Internal Access Helper (only for authenticated users) */}
      {!isInternal && (
        <Card className="border-dashed border-border bg-transparent">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Need internal access?</CardTitle>
            <CardDescription className="text-xs">
              If this is your founder account, you can promote your role via the Supabase SQL Editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-black rounded text-[10px] overflow-x-auto text-zo-silver/70 border border-border">
{`UPDATE profiles 
SET role = 'FOUNDER', full_name = 'Naveen'
WHERE email = '${user?.email}';`}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
