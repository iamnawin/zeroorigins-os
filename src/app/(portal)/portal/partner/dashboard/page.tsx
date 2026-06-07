import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, DollarSign, PieChart, 
  BarChart3, Plus, ShieldAlert, LogOut, UserCircle 
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { signOut } from '@/lib/actions/auth'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PartnerDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const isUnauthorized = params.message === 'unauthorized_internal'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id ?? '').single()

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 selection:bg-zo-amber/10">
      {/* Identity Card */}
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zo-amber/10 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-zo-amber" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Partner Portal</p>
                <h1 className="text-xl font-bold">{profile?.full_name || user?.email}</h1>
                <p className="text-xs text-muted-foreground">Account Role: <span className="text-zo-amber uppercase">{profile?.role}</span></p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm" className="h-9 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {isUnauthorized && (
        <Card className="bg-destructive/10 border-destructive/20 border shadow-lg">
          <CardContent className="p-4 flex items-start gap-4">
            <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm text-destructive font-bold">Access Restricted</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are signed in as <span className="font-bold">PARTNER</span>. The internal Control Room requires Founder, Director, or Staff level access.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black font-bold h-11">
                <Link href="/partner-with-us" className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Register Lead
                </Link>
              </Button>
              <Button variant="outline" className="w-full text-xs h-10 border-border/50">
                <Link href="/request-build">Submit My Project</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Placeholders */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border border-t-2 border-t-zo-amber opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Referrals</CardTitle>
              <CardDescription className="text-[10px]">Manage your referred leads and status.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Track conversion and next steps for your network.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-amber opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Commissions</CardTitle>
              <CardDescription className="text-[10px]">Earnings and payout history.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Transparent view of your rewards and schedule.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-amber opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <PieChart className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Analytics</CardTitle>
              <CardDescription className="text-[10px]">Partner performance metrics.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Visual data for your partnership engagement.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-amber opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Resource Kit</CardTitle>
              <CardDescription className="text-[10px]">Marketing and tie-up assets.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Download brand assets and collaboration docs.&rdquo;</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
