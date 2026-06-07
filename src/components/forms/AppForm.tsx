'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  AI_APP_STATUSES,
  AI_APP_CATEGORIES,
  AI_APP_TYPES,
  AIWorkspaceApp,
  AIAppStatus,
  AIAppCategory,
  AIAppType
} from '@/types'
import { Loader2 } from 'lucide-react'

interface AppFormProps {
  initialData?: AIWorkspaceApp
}

export function AppForm({ initialData }: AppFormProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [status, setStatus] = useState<AIAppStatus>(initialData?.status || 'idea')
  const [category, setCategory] = useState<AIAppCategory>(initialData?.category || 'internal_tool')
  const [appType, setAppType] = useState<AIAppType>(initialData?.app_type || 'web_app')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(initialData?.priority || 'medium')
  const [localPath, setLocalPath] = useState(initialData?.local_path || '')
  const [githubUrl, setGithubUrl] = useState(initialData?.github_url || '')
  const [vercelUrl, setVercelUrl] = useState(initialData?.vercel_url || '')
  const [liveUrl, setLiveUrl] = useState(initialData?.live_url || '')
  const [businessValue, setBusinessValue] = useState(initialData?.business_value || '')
  const [targetUser, setTargetUser] = useState(initialData?.target_user || '')
  const [monetizationIdea, setMonetizationIdea] = useState(initialData?.monetization_idea || '')
  const [currentIssue, setCurrentIssue] = useState(initialData?.current_issue || '')
  const [nextAction, setNextAction] = useState(initialData?.next_action || '')
  
  const [isClientDemo, setIsClientDemo] = useState<boolean>(initialData?.is_client_demo || false)
  const [isSellableProduct, setIsSellableProduct] = useState<boolean>(initialData?.is_sellable_product || false)
  const [isInternalTool, setIsInternalTool] = useState<boolean>(initialData?.is_internal_tool ?? true)
  const [isOpenSource, setIsOpenSource] = useState<boolean>(initialData?.is_open_source || false)

  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name,
      description,
      status,
      category,
      app_type: appType,
      priority,
      local_path: localPath,
      github_url: githubUrl,
      vercel_url: vercelUrl,
      live_url: liveUrl,
      business_value: businessValue,
      target_user: targetUser,
      monetization_idea: monetizationIdea,
      current_issue: currentIssue,
      next_action: nextAction,
      is_client_demo: isClientDemo,
      is_sellable_product: isSellableProduct,
      is_internal_tool: isInternalTool,
      is_open_source: isOpenSource,
      updated_at: new Date().toISOString(),
    }

    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from('ai_workspace_apps')
          .update(payload)
          .eq('id', initialData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ai_workspace_apps')
          .insert([payload])
        if (error) throw error
      }

      router.push('/internal/ai-workspace')
      router.refresh()
    } catch (error) {
      console.error('Error saving app:', error)
      alert('Failed to save. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basics */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="ZeroOrigins OS" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={status}
                    onChange={e => setStatus(e.target.value as AIAppStatus)}
                  >
                    {AI_APP_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={priority}
                    onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={category}
                    onChange={e => setCategory(e.target.value as AIAppCategory)}
                  >
                    {AI_APP_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appType">App Type</Label>
                  <select
                    id="appType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={appType}
                    onChange={e => setAppType(e.target.value as AIAppType)}
                  >
                    {AI_APP_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Company operating system..." rows={3} />
              </div>
              
              <div className="space-y-4 pt-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Attributes</Label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={isInternalTool} onChange={e => setIsInternalTool(e.target.checked)} className="accent-zo-purple" />
                    <span className="text-sm group-hover:text-zo-purple transition-colors">Internal Tool</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={isClientDemo} onChange={e => setIsClientDemo(e.target.checked)} className="accent-zo-purple" />
                    <span className="text-sm group-hover:text-zo-purple transition-colors">Client Demo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={isSellableProduct} onChange={e => setIsSellableProduct(e.target.checked)} className="accent-zo-purple" />
                    <span className="text-sm group-hover:text-zo-purple transition-colors">Sellable Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={isOpenSource} onChange={e => setIsOpenSource(e.target.checked)} className="accent-zo-purple" />
                    <span className="text-sm group-hover:text-zo-purple transition-colors">Open Source</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Links & Business */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Links & Paths</Label>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="localPath" className="text-[10px]">Local Path</Label>
                    <Input id="localPath" value={localPath} onChange={e => setLocalPath(e.target.value)} placeholder="D:\AI-Workspace\Repos\..." className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="githubUrl" className="text-[10px]">GitHub URL</Label>
                    <Input id="githubUrl" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="vercelUrl" className="text-[10px]">Vercel URL</Label>
                    <Input id="vercelUrl" value={vercelUrl} onChange={e => setVercelUrl(e.target.value)} placeholder="https://....vercel.app" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="liveUrl" className="text-[10px]">Live URL</Label>
                    <Input id="liveUrl" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Business Context</Label>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="targetUser" className="text-[10px]">Target User</Label>
                    <Input id="targetUser" value={targetUser} onChange={e => setTargetUser(e.target.value)} placeholder="Founders, Agencies..." className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="businessValue" className="text-[10px]">Business Value</Label>
                    <Textarea id="businessValue" value={businessValue} onChange={e => setBusinessValue(e.target.value)} placeholder="What does this solve?" rows={2} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="monetization" className="text-[10px]">Monetization Idea</Label>
                    <Input id="monetization" value={monetizationIdea} onChange={e => setMonetizationIdea(e.target.value)} placeholder="Subscription, License..." className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/50 pt-6">
            <div className="space-y-2">
              <Label htmlFor="currentIssue">Current Issue / Blocker</Label>
              <Input id="currentIssue" value={currentIssue} onChange={e => setCurrentIssue(e.target.value)} placeholder="Deployment failing on edge..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextAction">Next Action</Label>
              <Input id="nextAction" value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="Stabilize auth gateway..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="font-bold px-8" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : initialData?.id ? 'Update App' : 'Create App'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
