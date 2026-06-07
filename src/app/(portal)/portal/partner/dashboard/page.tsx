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
    <div className="max-w-5xl mx-auto space-y-8 p-4 selection:bg-zo-purple/20">
      {/* Identity Card */}
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zo-purple/10 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-zo-purple" />
              </div>
              <div>
                <p className="text-xs text-zo-muted uppercase tracking-widest font-bold">Partner Portal</p>
                <h1 className="text-xl font-bold text-zo-chrome">{profile?.full_name || user?.email}</h1>
                <p className="text-xs text-zo-muted">Account Role: <span className="text-zo-purple-2 uppercase font-bold">{profile?.role}</span></p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <form action={signOut}>
                <Button type="submit" variant="secondary" size="sm" className="h-9 border-zo-border-soft hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all">
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
              <p className="text-xs text-zo-muted leading-relaxed">
                You are signed in as <span className="font-bold text-foreground">PARTNER</span>. The internal Control Room requires Founder, Director, or Staff level access.
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
              <CardTitle className="text-xs text-zo-muted uppercase tracking-widest font-bold">Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full font-bold h-11">
                <Link href="/partner-with-us" className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Register Lead
                </Link>
              </Button>
              <Button variant="secondary" className="w-full text-xs h-10 border-zo-border-soft">
                <Link href="/request-build">Submit My Project</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Placeholders */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border border-t-2 border-t-zo-purple opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-zo-purple" />
                <Badge variant="outline" className="text-[8px] h-4 border-zo-purple/30 text-zo-purple-2">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold text-zo-chrome">Referrals</CardTitle>
              <CardDescription className="text-[10px] text-zo-muted">Manage your referred leads and status.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-zo-muted italic">&ldquo;Track conversion and next steps for your network.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-purple opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-4 h-4 text-zo-purple" />
                <Badge variant="outline" className="text-[8px] h-4 border-zo-purple/30 text-zo-purple-2">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold text-zo-chrome">Commissions</CardTitle>
              <CardDescription className="text-[10px] text-zo-muted">Earnings and payout history.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-zo-muted italic">&ldquo;Transparent view of your rewards and schedule.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-purple opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <PieChart className="w-4 h-4 text-zo-purple" />
                <Badge variant="outline" className="text-[8px] h-4 border-zo-purple/30 text-zo-purple-2">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold text-zo-chrome">Analytics</CardTitle>
              <CardDescription className="text-[10px] text-zo-muted">Partner performance metrics.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-zo-muted italic">&ldquo;Visual data for your partnership engagement.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-purple opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-4 h-4 text-zo-purple" />
                <Badge variant="outline" className="text-[8px] h-4 border-zo-purple/30 text-zo-purple-2">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold text-zo-chrome">Resource Kit</CardTitle>
              <CardDescription className="text-[10px] text-zo-muted">Marketing and tie-up assets.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-zo-muted italic">&ldquo;Download brand assets and collaboration docs.&rdquo;</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
