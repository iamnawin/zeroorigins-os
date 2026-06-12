'use client'

import { useState } from 'react'
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
  type AIWorkspaceApp,
  type AIAppStatus,
  type AIAppCategory,
  type AIAppType
} from '@/types'
import { Loader2 } from 'lucide-react'
import { createApp, updateApp } from '@/lib/actions/internal-resources'

interface AppFormProps {
  initialData?: AIWorkspaceApp
}

export function AppForm({ initialData }: AppFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

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
    }

    try {
      const result = initialData?.id
        ? await updateApp(initialData.id, payload)
        : await createApp(payload)

      if (result.error) throw new Error(result.error)

      router.push('/internal/ai-workspace')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="zo-glass-elevated border-white/10">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Header Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">App Details</h3>
                <p className="text-sm text-white/60">Basic information about your AI workspace app.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-white/80 font-medium">App Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="ZeroOrigins OS" 
                    required 
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-white/80 font-medium">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Company operating system for managing projects, leads, and AI workspace..." 
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Configuration Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Configuration</h3>
                <p className="text-sm text-white/60">Status, priority, and categorization settings.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="status" className="text-white/80 font-medium">Status</Label>
                  <select
                    id="status"
                    className="h-12 w-full bg-white/5 border border-white/10 rounded-xl px-4 text-white zo-focus-ring"
                    value={status}
                    onChange={e => setStatus(e.target.value as AIAppStatus)}
                  >
                    {AI_APP_STATUSES.map(s => (
                      <option key={s} value={s} className="bg-black text-white">
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="priority" className="text-white/80 font-medium">Priority</Label>
                  <select
                    id="priority"
                    className="h-12 w-full bg-white/5 border border-white/10 rounded-xl px-4 text-white zo-focus-ring"
                    value={priority}
                    onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                  >
                    <option value="low" className="bg-black text-white">Low</option>
                    <option value="medium" className="bg-black text-white">Medium</option>
                    <option value="high" className="bg-black text-white">High</option>
                    <option value="critical" className="bg-black text-white">Critical</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category" className="text-white/80 font-medium">Category</Label>
                  <select
                    id="category"
                    className="h-12 w-full bg-white/5 border border-white/10 rounded-xl px-4 text-white zo-focus-ring"
                    value={category}
                    onChange={e => setCategory(e.target.value as AIAppCategory)}
                  >
                    {AI_APP_CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-black text-white">
                        {c.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="appType" className="text-white/80 font-medium">App Type</Label>
                  <select
                    id="appType"
                    className="h-12 w-full bg-white/5 border border-white/10 rounded-xl px-4 text-white zo-focus-ring"
                    value={appType}
                    onChange={e => setAppType(e.target.value as AIAppType)}
                  >
                    {AI_APP_TYPES.map(t => (
                      <option key={t} value={t} className="bg-black text-white">
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Attributes Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Attributes</h3>
                <p className="text-sm text-white/60">Define the nature and purpose of this app.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer zo-motion-safe group">
                  <input 
                    type="checkbox" 
                    checked={isInternalTool} 
                    onChange={e => setIsInternalTool(e.target.checked)} 
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white group-hover:text-purple-300 zo-motion-safe">Internal Tool</div>
                    <div className="text-xs text-white/50">For ZeroOrigins team use</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer zo-motion-safe group">
                  <input 
                    type="checkbox" 
                    checked={isClientDemo} 
                    onChange={e => setIsClientDemo(e.target.checked)} 
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white group-hover:text-purple-300 zo-motion-safe">Client Demo</div>
                    <div className="text-xs text-white/50">Showcase for prospects</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer zo-motion-safe group">
                  <input 
                    type="checkbox" 
                    checked={isSellableProduct} 
                    onChange={e => setIsSellableProduct(e.target.checked)} 
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white group-hover:text-purple-300 zo-motion-safe">Sellable Product</div>
                    <div className="text-xs text-white/50">Commercial offering</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer zo-motion-safe group">
                  <input 
                    type="checkbox" 
                    checked={isOpenSource} 
                    onChange={e => setIsOpenSource(e.target.checked)} 
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white group-hover:text-purple-300 zo-motion-safe">Open Source</div>
                    <div className="text-xs text-white/50">Public repository</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Links & Paths Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Links & Paths</h3>
                <p className="text-sm text-white/60">Development and deployment endpoints.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="localPath" className="text-white/80 font-medium">Local Path</Label>
                  <Input 
                    id="localPath" 
                    value={localPath} 
                    onChange={e => setLocalPath(e.target.value)} 
                    placeholder="D:\AI-Workspace\Repos\..." 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring text-sm font-mono"
                  />
                  <p className="text-xs text-white/40">Local development directory</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="githubUrl" className="text-white/80 font-medium">GitHub URL</Label>
                  <Input 
                    id="githubUrl" 
                    value={githubUrl} 
                    onChange={e => setGithubUrl(e.target.value)} 
                    placeholder="https://github.com/..." 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring text-sm"
                  />
                  <p className="text-xs text-white/40">Source code repository</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="vercelUrl" className="text-white/80 font-medium">Vercel URL</Label>
                  <Input 
                    id="vercelUrl" 
                    value={vercelUrl} 
                    onChange={e => setVercelUrl(e.target.value)} 
                    placeholder="https://....vercel.app" 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring text-sm"
                  />
                  <p className="text-xs text-white/40">Preview deployment</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="liveUrl" className="text-white/80 font-medium">Live URL</Label>
                  <Input 
                    id="liveUrl" 
                    value={liveUrl} 
                    onChange={e => setLiveUrl(e.target.value)} 
                    placeholder="https://..." 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring text-sm"
                  />
                  <p className="text-xs text-white/40">Production domain</p>
                </div>
              </div>
            </div>

            {/* Business Context Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Business Context</h3>
                <p className="text-sm text-white/60">Market positioning and value proposition.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="targetUser" className="text-white/80 font-medium">Target User</Label>
                  <Input 
                    id="targetUser" 
                    value={targetUser} 
                    onChange={e => setTargetUser(e.target.value)} 
                    placeholder="Founders, Agencies, SMBs..." 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="monetization" className="text-white/80 font-medium">Monetization</Label>
                  <Input 
                    id="monetization" 
                    value={monetizationIdea} 
                    onChange={e => setMonetizationIdea(e.target.value)} 
                    placeholder="Subscription, License, Usage-based..." 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="businessValue" className="text-white/80 font-medium">Business Value</Label>
                <Textarea 
                  id="businessValue" 
                  value={businessValue} 
                  onChange={e => setBusinessValue(e.target.value)} 
                  placeholder="What problem does this solve? How does it create value?" 
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring resize-none"
                />
              </div>
            </div>

            {/* Status & Next Steps Section */}
            <div className="space-y-6 border-t border-white/10 pt-8">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Current Status</h3>
                <p className="text-sm text-white/60">Track progress and next actions.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="currentIssue" className="text-white/80 font-medium">Current Issue / Blocker</Label>
                  <Input 
                    id="currentIssue" 
                    value={currentIssue} 
                    onChange={e => setCurrentIssue(e.target.value)} 
                    placeholder="Deployment failing on edge cases..." 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="nextAction" className="text-white/80 font-medium">Next Action</Label>
                  <Input 
                    id="nextAction" 
                    value={nextAction} 
                    onChange={e => setNextAction(e.target.value)} 
                    placeholder="Stabilize auth gateway, add error handling..." 
                    className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 zo-focus-ring"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-white/10">
              {error && <p className="sm:mr-auto text-sm text-red-400">{error}</p>}
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="h-12 px-8 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 zo-motion-safe"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-12 px-8 zo-button-primary font-semibold text-white" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                    Saving...
                  </>
                ) : (
                  initialData?.id ? 'Update App' : 'Create App'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
