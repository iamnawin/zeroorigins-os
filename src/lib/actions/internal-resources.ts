'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  AIAppCategory,
  AIAppStatus,
  AIAppType,
  CalendarProvider,
  CalendarSyncStatus,
  CustomerStatus,
  DealStage,
  FinanceCategory,
  FinanceTransactionStatus,
  IdeaStatus,
  KnowledgeCategory,
  LeadStatus,
  MeetingStatus,
  PartnerStatus,
  ProfileStatus,
  ProjectStatus,
  ProposalStatus,
  RecurrenceInterval,
  Role,
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

export type IdeaFormInput = {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: IdeaStatus
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

export type CustomerFormInput = {
  name: string
  email: string
  company?: string
  phone?: string
  website?: string
  notes?: string
  status?: CustomerStatus
  lead_id?: string | null
}

export type ProposalFormInput = {
  title: string
  content?: string
  lead_id?: string | null
  customer_id?: string | null
  project_id?: string | null
  deal_id?: string | null
  service_type?: string
  scope?: string
  amount?: string | number | null
  timeline?: string
  proposal_url?: string
  internal_notes?: string
  customer_visible_notes?: string
  sent_at?: string | null
  expires_at?: string | null
  status?: ProposalStatus
}

export type DealFormInput = {
  name: string
  lead_id?: string | null
  stage?: DealStage
  estimated_value?: string | number | null
  expected_close_date?: string | null
  next_step?: string
  notes?: string
}

export type MeetingFormInput = {
  title: string
  entity_type?: 'lead' | 'deal' | 'customer' | 'project' | 'partner' | 'internal'
  entity_id?: string | null
  lead_id?: string | null
  deal_id?: string | null
  customer_id?: string | null
  project_id?: string | null
  scheduled_at: string
  duration_minutes?: string | number | null
  attendees?: string[] | string
  agenda?: string
  outcome?: string
  next_action?: string
  status?: MeetingStatus
  owner_id?: string | null
}

export type KnowledgeArticleFormInput = {
  title: string
  content?: string
  category?: KnowledgeCategory | string
  tags?: string[] | string
}

export type VendorFormInput = {
  name: string
  website?: string
  contact_email?: string
  category?: FinanceCategory | string
  notes?: string
}

export type FinanceTransactionFormInput = {
  description: string
  amount: string | number | null
  currency?: string
  category?: FinanceCategory | string
  status?: FinanceTransactionStatus
  vendor_id?: string | null
  project_id?: string | null
  customer_id?: string | null
  ai_workspace_app_id?: string | null
  date?: string | null
  due_date?: string | null
  paid_at?: string | null
  invoice_url?: string
  receipt_url?: string
  recurrence_interval?: RecurrenceInterval
  next_due_date?: string | null
  notes?: string
}

export type ProjectFormInput = {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: ProjectStatus
  customer_id?: string | null
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

export type TeamProfileFormInput = {
  full_name: string
  title?: string
  role: Extract<Role, 'admin' | 'employee'>
  status: ProfileStatus
  calendar_email?: string
  calendar_provider: CalendarProvider
  calendar_sync_enabled: boolean
  calendar_sync_status: CalendarSyncStatus
}

export async function requireInternalUser(supabase: Supabase) {
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

function optionalNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(parsed)) throw new Error('Amount must be a valid number.')
  return parsed
}

function optionalTextArray(value?: string[] | string | null) {
  if (Array.isArray(value)) return value.map(v => v.trim()).filter(Boolean)
  const trimmed = value?.trim()
  return trimmed ? trimmed.split(',').map(v => v.trim()).filter(Boolean) : []
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

export async function createIdea(input: IdeaFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('ideas')
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
    revalidateResource(['/internal/ideas'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateIdea(id: string, input: IdeaFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('ideas')
      .update({
        title: requiredText(input.title, 'Title'),
        description: optionalText(input.description),
        priority: input.priority ?? 'medium',
        status: input.status ?? 'draft',
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/ideas', `/internal/ideas/${id}`])
    return { id }
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

export async function createCustomer(input: CustomerFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: requiredText(input.name, 'Name'),
        email: requiredText(input.email, 'Email'),
        company: optionalText(input.company),
        phone: optionalText(input.phone),
        website: optionalText(input.website),
        notes: optionalText(input.notes),
        lead_id: optionalText(input.lead_id),
        status: 'active',
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/customers'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateCustomer(id: string, input: CustomerFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('customers')
      .update({
        name: requiredText(input.name, 'Name'),
        email: requiredText(input.email, 'Email'),
        company: optionalText(input.company),
        phone: optionalText(input.phone),
        website: optionalText(input.website),
        notes: optionalText(input.notes),
        lead_id: optionalText(input.lead_id),
        status: input.status ?? 'active',
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/customers', `/internal/customers/${id}`])
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
        customer_id: optionalText(input.customer_id),
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

export async function createProposal(input: ProposalFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        ...proposalPayload(input),
        status: input.status ?? 'draft',
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/proposals'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateProposal(id: string, input: ProposalFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('proposals')
      .update({
        ...proposalPayload(input),
        status: input.status ?? 'draft',
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/proposals', `/internal/proposals/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createDeal(input: DealFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('deals')
      .insert({
        name: requiredText(input.name, 'Deal name'),
        lead_id: optionalText(input.lead_id),
        stage: input.stage ?? 'qualifying',
        estimated_value: optionalNumber(input.estimated_value),
        expected_close_date: optionalText(input.expected_close_date),
        next_step: optionalText(input.next_step),
        notes: optionalText(input.notes),
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/deals'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateDeal(id: string, input: DealFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('deals')
      .update({
        name: requiredText(input.name, 'Deal name'),
        lead_id: optionalText(input.lead_id),
        stage: input.stage ?? 'qualifying',
        estimated_value: optionalNumber(input.estimated_value),
        expected_close_date: optionalText(input.expected_close_date),
        next_step: optionalText(input.next_step),
        notes: optionalText(input.notes),
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/deals', `/internal/deals/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createMeeting(input: MeetingFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        ...meetingPayload(input),
        status: input.status ?? 'scheduled',
        owner_id: optionalText(input.owner_id) ?? user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/meetings'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateMeeting(id: string, input: MeetingFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { error } = await supabase
      .from('meetings')
      .update({
        ...meetingPayload(input),
        status: input.status ?? 'scheduled',
        owner_id: optionalText(input.owner_id) ?? user.id,
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/meetings', `/internal/meetings/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateTeamProfile(profileId: string, input: TeamProfileFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentProfileError) throw currentProfileError
    if (currentProfile?.role !== 'admin') {
      throw new Error('Only admins can update team profiles.')
    }

    if (profileId === user.id && (input.role !== 'admin' || input.status !== 'active')) {
      throw new Error('You cannot remove your own admin access.')
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: requiredText(input.full_name, 'Full name'),
        title: optionalText(input.title),
        role: input.role,
        status: input.status,
        calendar_email: optionalText(input.calendar_email),
        calendar_provider: input.calendar_provider,
        calendar_sync_enabled: Boolean(input.calendar_sync_enabled),
        calendar_sync_status: input.calendar_sync_status,
      })
      .eq('id', profileId)

    if (error) throw error
    revalidateResource(['/internal/settings', '/internal/meetings'])
    return { id: profileId }
  } catch (error) {
    return toResult(error)
  }
}

export async function createKnowledgeArticle(input: KnowledgeArticleFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('knowledge_articles')
      .insert({
        ...knowledgeArticlePayload(input),
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/knowledge'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateKnowledgeArticle(id: string, input: KnowledgeArticleFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('knowledge_articles')
      .update(knowledgeArticlePayload(input))
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/knowledge', `/internal/knowledge/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createVendor(input: VendorFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('vendors')
      .insert({
        name: requiredText(input.name, 'Vendor name'),
        website: optionalText(input.website),
        contact_email: optionalText(input.contact_email),
        category: optionalText(input.category),
        notes: optionalText(input.notes),
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/finance'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateVendor(id: string, input: VendorFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('vendors')
      .update({
        name: requiredText(input.name, 'Vendor name'),
        website: optionalText(input.website),
        contact_email: optionalText(input.contact_email),
        category: optionalText(input.category),
        notes: optionalText(input.notes),
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/finance'])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function createFinanceTransaction(input: FinanceTransactionFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({
        ...financeTransactionPayload(input),
        type: 'expense',
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/finance'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateFinanceTransaction(id: string, input: FinanceTransactionFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('finance_transactions')
      .update(financeTransactionPayload(input))
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/finance'])
    return { id }
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
        customer_id: optionalText(input.customer_id),
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

export async function convertLeadToDeal(leadId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, company, service_interest, notes')
      .eq('id', leadId)
      .single()

    if (leadError) throw leadError
    if (!lead) throw new Error('Lead not found.')

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        name: `${lead.company || lead.name} - ${lead.service_interest || 'Opportunity'}`,
        lead_id: lead.id,
        stage: 'qualifying',
        next_step: 'Schedule discovery and confirm scope.',
        notes: optionalText(lead.notes),
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (dealError) throw dealError

    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: 'discovery_scheduled' })
      .eq('id', lead.id)

    if (updateError) throw updateError

    revalidateResource(['/internal/leads', `/internal/leads/${lead.id}`, '/internal/deals'])
    return { id: deal.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function markProposalAccepted(proposalId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'accepted' })
      .eq('id', proposalId)

    if (error) throw error
    revalidateResource(['/internal/proposals', `/internal/proposals/${proposalId}`])
    return { id: proposalId }
  } catch (error) {
    return toResult(error)
  }
}

export async function createProjectFromCustomer(customerId: string, title?: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, company, notes')
      .eq('id', customerId)
      .single()

    if (customerError) throw customerError
    if (!customer) throw new Error('Customer not found.')

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: requiredText(title || `${customer.company || customer.name} Project`, 'Project title'),
        description: optionalText(customer.notes),
        status: 'planned',
        priority: 'medium',
        customer_id: customer.id,
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (projectError) throw projectError
    revalidateResource(['/internal/projects', '/internal/customers', `/internal/customers/${customer.id}`])
    return { id: project.id }
  } catch (error) {
    return toResult(error)
  }
}

function proposalPayload(input: ProposalFormInput) {
  return {
    title: requiredText(input.title, 'Title'),
    content: optionalText(input.content),
    lead_id: optionalText(input.lead_id),
    customer_id: optionalText(input.customer_id),
    project_id: optionalText(input.project_id),
    deal_id: optionalText(input.deal_id),
    service_type: optionalText(input.service_type),
    scope: optionalText(input.scope),
    amount: optionalNumber(input.amount),
    timeline: optionalText(input.timeline),
    proposal_url: optionalText(input.proposal_url),
    internal_notes: optionalText(input.internal_notes),
    customer_visible_notes: optionalText(input.customer_visible_notes),
    sent_at: optionalText(input.sent_at),
    expires_at: optionalText(input.expires_at),
  }
}

function meetingPayload(input: MeetingFormInput) {
  return {
    title: requiredText(input.title, 'Meeting title'),
    entity_type: input.entity_type ?? 'internal',
    entity_id: optionalText(input.entity_id),
    lead_id: optionalText(input.lead_id),
    deal_id: optionalText(input.deal_id),
    customer_id: optionalText(input.customer_id),
    project_id: optionalText(input.project_id),
    scheduled_at: requiredText(input.scheduled_at, 'Scheduled time'),
    duration_minutes: optionalNumber(input.duration_minutes) ?? 30,
    attendees: optionalTextArray(input.attendees),
    agenda: optionalText(input.agenda),
    outcome: optionalText(input.outcome),
    next_action: optionalText(input.next_action),
  }
}

function knowledgeArticlePayload(input: KnowledgeArticleFormInput) {
  return {
    title: requiredText(input.title, 'Title'),
    content: optionalText(input.content),
    category: optionalText(input.category),
    tags: optionalTextArray(input.tags),
  }
}

function financeTransactionPayload(input: FinanceTransactionFormInput) {
  return {
    description: requiredText(input.description, 'Description'),
    amount: optionalNumber(input.amount) ?? 0,
    currency: optionalText(input.currency) ?? 'USD',
    category: optionalText(input.category),
    status: input.status ?? 'paid',
    vendor_id: optionalText(input.vendor_id),
    project_id: optionalText(input.project_id),
    customer_id: optionalText(input.customer_id),
    ai_workspace_app_id: optionalText(input.ai_workspace_app_id),
    date: optionalText(input.date),
    due_date: optionalText(input.due_date),
    paid_at: optionalText(input.paid_at),
    invoice_url: optionalText(input.invoice_url),
    receipt_url: optionalText(input.receipt_url),
    recurrence_interval: input.recurrence_interval ?? 'none',
    next_due_date: optionalText(input.next_due_date),
    notes: optionalText(input.notes),
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
