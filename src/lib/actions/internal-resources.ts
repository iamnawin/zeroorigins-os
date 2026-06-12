'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  AIAppCategory,
  AIAppStatus,
  AIAppType,
  LeadStatus,
  PartnerStatus,
  ProjectStatus,
  TaskStatus,
} from '@/types'

type ActionResult = {
  id?: string
  error?: string
}

type Supabase = Awaited<ReturnType<typeof createClient>>

export type LeadFormInput = {
  name: string
  email: string
  company?: string
  source?: string
  service_interest?: string
  budget_range?: string
  notes?: string
  status?: LeadStatus
}

export type PartnerFormInput = {
  name: string
  email: string
  company?: string
  type?: string
  pitch?: string
  notes?: string
  status?: PartnerStatus
}

export type ProjectFormInput = {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: ProjectStatus
  start_date?: string | null
  target_date?: string | null
}

export type TaskFormInput = {
  title: string
  description?: string
  project_id?: string | null
  status?: TaskStatus
}

export type AppFormInput = {
  name: string
  description?: string
  status: AIAppStatus
  category: AIAppCategory
  app_type: AIAppType
  priority: 'low' | 'medium' | 'high' | 'critical'
  local_path?: string
  github_url?: string
  vercel_url?: string
  live_url?: string
  business_value?: string
  target_user?: string
  monetization_idea?: string
  current_issue?: string
  next_action?: string
  is_client_demo: boolean
  is_sellable_product: boolean
  is_internal_tool: boolean
  is_open_source: boolean
}

async function requireInternalUser(supabase: Supabase) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be signed in to save internal workspace data.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Your profile is not ready yet. Sign out and sign back in, then try again.')
  }

  const role = String(profile.role)
  const status = String(profile.status ?? 'active')
  if (!['admin', 'employee'].includes(role) || status !== 'active') {
    throw new Error('Your account does not have access to save internal workspace data.')
  }

  return user
}

function requiredText(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label} is required.`)
  return trimmed
}

function optionalText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function revalidateResource(paths: string[]) {
  revalidatePath('/internal/control-room')
  for (const path of paths) {
    revalidatePath(path)
  }
}

function toResult(error: unknown): ActionResult {
  return { error: error instanceof Error ? error.message : 'Something went wrong while saving.' }
}

export async function createLead(input: LeadFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: requiredText(input.name, 'Name'),
        email: requiredText(input.email, 'Email'),
        company: optionalText(input.company),
        source: optionalText(input.source),
        service_interest: optionalText(input.service_interest),
        budget_range: optionalText(input.budget_range),
        notes: optionalText(input.notes),
        status: 'new',
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/leads'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateLead(id: string, input: LeadFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('leads')
      .update({
        name: requiredText(input.name, 'Name'),
        email: requiredText(input.email, 'Email'),
        company: optionalText(input.company),
        source: optionalText(input.source),
        service_interest: optionalText(input.service_interest),
        budget_range: optionalText(input.budget_range),
        notes: optionalText(input.notes),
        status: input.status ?? 'new',
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/leads', `/internal/leads/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createPartner(input: PartnerFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('partners')
      .insert({
        name: requiredText(input.name, 'Name'),
        email: requiredText(input.email, 'Email'),
        company: optionalText(input.company),
        type: optionalText(input.type),
        pitch: optionalText(input.pitch),
        notes: optionalText(input.notes),
        status: 'new_application',
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/partners'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updatePartner(id: string, input: PartnerFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('partners')
      .update({
        name: requiredText(input.name, 'Name'),
        email: requiredText(input.email, 'Email'),
        company: optionalText(input.company),
        type: optionalText(input.type),
        pitch: optionalText(input.pitch),
        notes: optionalText(input.notes),
        status: input.status ?? 'new_application',
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/partners', `/internal/partners/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createProject(input: ProjectFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: requiredText(input.title, 'Title'),
        description: optionalText(input.description),
        priority: input.priority ?? 'medium',
        status: 'draft',
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/projects'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateProject(id: string, input: ProjectFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('projects')
      .update({
        title: requiredText(input.title, 'Title'),
        description: optionalText(input.description),
        priority: input.priority ?? 'medium',
        status: input.status ?? 'draft',
        start_date: optionalText(input.start_date),
        target_date: optionalText(input.target_date),
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/projects', `/internal/projects/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createTask(input: TaskFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: requiredText(input.title, 'Title'),
        description: optionalText(input.description),
        project_id: optionalText(input.project_id),
        status: 'todo',
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/tasks'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateTask(id: string, input: TaskFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('tasks')
      .update({
        title: requiredText(input.title, 'Title'),
        description: optionalText(input.description),
        project_id: optionalText(input.project_id),
        status: input.status ?? 'todo',
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/tasks', `/internal/tasks/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createApp(input: AppFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('ai_workspace_apps')
      .insert({
        ...appPayload(input),
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/ai-workspace'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateApp(id: string, input: AppFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('ai_workspace_apps')
      .update(appPayload(input))
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/ai-workspace', `/internal/ai-workspace/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

function appPayload(input: AppFormInput) {
  return {
    name: requiredText(input.name, 'App name'),
    description: optionalText(input.description),
    status: input.status,
    category: input.category,
    app_type: input.app_type,
    priority: input.priority,
    local_path: optionalText(input.local_path),
    github_url: optionalText(input.github_url),
    vercel_url: optionalText(input.vercel_url),
    live_url: optionalText(input.live_url),
    business_value: optionalText(input.business_value),
    target_user: optionalText(input.target_user),
    monetization_idea: optionalText(input.monetization_idea),
    current_issue: optionalText(input.current_issue),
    next_action: optionalText(input.next_action),
    is_client_demo: input.is_client_demo,
    is_sellable_product: input.is_sellable_product,
    is_internal_tool: input.is_internal_tool,
    is_open_source: input.is_open_source,
  }
}
