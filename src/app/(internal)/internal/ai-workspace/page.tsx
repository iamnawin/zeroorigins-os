import Link from 'next/link'
import { Bot, BrainCircuit, CalendarClock, FileText, Mail, MessageSquareText, PlayCircle, Settings2, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AiConnectionTester } from '@/components/ai/AiConnectionTester'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Capability = {
  title: string
  status: string
  provider: string
  model: string
  lastRun: string
  automation: string
  action: string
  href: string
  icon: LucideIcon
}

const capabilities: Capability[] = [
  { title: 'Email Intelligence', status: 'Active', provider: 'Together AI', model: 'gpt-oss-20b', lastRun: 'Waiting for router event', automation: 'Email Router', action: 'Test Email Router', href: '/internal/automation?tab=email-router', icon: Mail },
  { title: 'Task Assistant', status: 'Active', provider: 'Together AI', model: 'Qwen3.5-9B', lastRun: 'On demand', automation: 'AI Assist', action: 'Create Task Draft', href: '/internal/tasks/new', icon: BrainCircuit },
  { title: 'Meeting Assistant', status: 'Active', provider: 'Together AI', model: 'Qwen3.5-9B', lastRun: 'On demand', automation: 'Calendar Sync', action: 'Prepare Agenda', href: '/internal/meetings', icon: CalendarClock },
  { title: 'Proposal Assistant', status: 'Active', provider: 'Together AI', model: 'gpt-oss-120b', lastRun: 'On demand', automation: 'Proposal Drafting', action: 'Create Outline', href: '/internal/proposals/new', icon: FileText },
  { title: 'Content Assistant', status: 'Planned', provider: 'Together AI', model: 'gpt-oss-20b', lastRun: 'Not run', automation: 'Content Queue', action: 'Open Content', href: '/internal/business-verticals', icon: MessageSquareText },
  { title: 'Prompt Lab', status: 'Planned', provider: 'Together AI', model: 'Model routed', lastRun: 'Not run', automation: 'Manual testing', action: 'Open Lab', href: '/internal/ai-workspace', icon: Bot },
  { title: 'Automation Runs', status: 'Active', provider: 'n8n + Together AI', model: 'Mixed', lastRun: 'See logs', automation: 'Automation Logs', action: 'View Runs', href: '/internal/automation?tab=logs', icon: Workflow },
  { title: 'Model Settings', status: 'Active', provider: 'Together AI', model: 'Router controlled', lastRun: 'Runtime', automation: 'Model Router', action: 'Test Provider', href: '/internal/ai-workspace#provider-test', icon: Settings2 },
]

export default function AIWorkspacePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-zo-purple-2">AI Workspace</p>
        <h1 className="mt-1 text-2xl font-bold">AI capabilities and helpers</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          AI Workspace is only for capabilities, prompts, models, and automations. Brands and product initiatives now live in Business Verticals.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/internal/business-verticals"><Button size="sm" variant="outline">Open Business Verticals</Button></Link>
          <Link href="/internal/automation"><Button size="sm" variant="outline"><PlayCircle className="mr-1 h-4 w-4" />Automation</Button></Link>
        </div>
      </div>

      <div id="provider-test">
        <AiConnectionTester />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map(item => (
          <Card key={item.title} className="border-border bg-card">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <item.icon className="h-5 w-5 text-zo-purple" />
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{item.status}</span>
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Provider" value={item.provider} />
              <Info label="Model" value={item.model} />
              <Info label="Last run" value={item.lastRun} />
              <Info label="Automation" value={item.automation} />
              <Link href={item.href}>
                <Button size="sm" variant="outline" className="mt-2 w-full">{item.action}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  )
}
