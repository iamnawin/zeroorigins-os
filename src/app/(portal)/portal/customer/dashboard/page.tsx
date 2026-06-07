import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { INTERNAL_ROLES } from '@/types'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, FolderKanban, LifeBuoy, 
  MessageSquare, Plus, ShieldAlert, LogOut, UserCircle 
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

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

  const isInternal = INTERNAL_ROLES.includes(profile?.role || 'CUSTOMER')
  const noFounderExists = user && (founderCount || 0) === 0

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 selection:bg-zo-silver/30">
      {/* Identity Card */}
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zo-silver/10 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-zo-silver" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Customer Portal</p>
                <h1 className="text-xl font-bold">{profile?.full_name || user?.email}</h1>
                <p className="text-xs text-muted-foreground">Account Role: <span className="text-zo-amber uppercase">{profile?.role}</span></p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm" className="h-9 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
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
                You are signed in as <span className="font-bold">CUSTOMER</span>. The internal Control Room requires Founder, Director, or Staff level access.
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
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Build Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-zo-amber hover:bg-zo-amber/90 text-black font-bold h-11">
                <Link href="/request-build" className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Request a Build
                </Link>
              </Button>
              <Button variant="outline" className="w-full text-xs h-10 border-border/50">
                <Link href="/partner-with-us">Partner with Us</Link>
              </Button>
            </CardContent>
          </Card>

          {noFounderExists && (
            <Card className="bg-zo-amber/5 border-zo-amber/20 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-zo-amber uppercase tracking-widest">First Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-center">
                <p className="text-[10px] text-muted-foreground">No Founder found. If you are the owner, initialize the system.</p>
                <Button variant="outline" className="w-full text-xs h-9 border-zo-amber/30 text-zo-amber hover:bg-zo-amber/10 font-bold">
                  <Link href="/setup-founder">Set up Founder Account</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Feature Placeholders */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border border-t-2 border-t-zo-amber/30 opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <FolderKanban className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Active Projects</CardTitle>
              <CardDescription className="text-[10px]">Track your builds and milestones.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Connect your project to track delivery in real-time.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-amber/30 opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Proposals</CardTitle>
              <CardDescription className="text-[10px]">Review and approve project scopes.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Review pending proposals and service agreements.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-amber/30 opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Support Hub</CardTitle>
              <CardDescription className="text-[10px]">Direct channel for issues and feedback.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Direct communication with the ZeroOrigins team.&rdquo;</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-t-2 border-t-zo-amber/30 opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <LifeBuoy className="w-4 h-4 text-zo-amber" />
                <Badge variant="outline" className="text-[8px] h-4">Soon</Badge>
              </div>
              <CardTitle className="text-sm font-bold">Resources</CardTitle>
              <CardDescription className="text-[10px]">Knowledge base for your OS.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground italic">&ldquo;Access documentation and training materials.&rdquo;</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Internal Access Helper */}
      {!isInternal && (
        <Card className="border-dashed border-border bg-transparent opacity-40 hover:opacity-100 transition-opacity">
          <CardHeader>
            <CardTitle className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Developer Fallback</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-black rounded text-[9px] overflow-x-auto text-zo-silver/50 border border-border">
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
