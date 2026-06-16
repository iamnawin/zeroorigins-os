'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createGoogleCalendarEvent } from '@/lib/google/calendar'
import { sendMeetingNotification } from '@/lib/email/notifications'
import type {
  AIAppCategory,
  AIAppStatus,
  AIAppType,
  ApplicationStage,
  ApplicationStatus,
  ApplicationType,
  BusinessVerticalStatus,
  BusinessVerticalType,
  CalendarProvider,
  CalendarSyncStatus,
  CustomerStatus,
  CurrencyCode,
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
  VendorCategory,
} from '@/types'

type ActionResult = {
  id?: string
  error?: string
}

type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
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
  related_vertical_id?: string | null
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
  related_vertical_id?: string | null
  source?: 'manual' | 'google_calendar'
  calendar_event_id?: string
  meeting_link?: string
  notes?: string
  sync_status?: CalendarSyncStatus
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
  category?: VendorCategory | FinanceCategory | string
  currency?: CurrencyCode | string
  monthly_cost?: string | number | null
  billing_cycle?: RecurrenceInterval
  renewal_date?: string | null
  owner?: string
  notes?: string
  status?: 'active' | 'paused' | 'cancelled'
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
  related_vertical_id?: string | null
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
  related_vertical_id?: string | null
}

export type BusinessVerticalFormInput = {
  name: string
  slug?: string
  type: BusinessVerticalType
  status: BusinessVerticalStatus
  description?: string
  owner?: string
  website?: string
  logo_url?: string
  brand_color?: string
  notes?: string
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

function slugify(value: string) {
  return requiredText(value, 'Name')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  if (error instanceof Error) return { error: error.message }
  if (error && typeof error === 'object' && 'message' in error) {
    const typed = error as SupabaseErrorLike
    return { error: [typed.message, typed.details, typed.hint].filter(Boolean).join(' ') }
  }
  return { error: 'Something went wrong while saving.' }
}

export type ApplicationFormInput = {
  name: string
  slug?: string
  description?: string
  vertical_id?: string
  stage: ApplicationStage
  status: ApplicationStatus
  type: ApplicationType
  repo_url?: string
  local_folder_path?: string
  docs_url?: string
  docs_folder_path?: string
  website_url?: string
  deployment_url?: string
  database_url?: string
  n8n_workflow_url?: string
  figma_url?: string
  tech_stack?: string[] | string
  build_status?: string
  next_action?: string
  notes?: string
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
    const payload = meetingPayload(input)

    // Always push to Google Calendar if user has connected their account
    const { data: tokenRow } = await supabase
      .from('google_tokens')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (tokenRow) {
      try {
        const googleEvent = await createGoogleCalendarEvent(supabase, user.id, {
          title: payload.title,
          scheduled_at: payload.scheduled_at,
          duration_minutes: payload.duration_minutes,
          attendees: payload.attendees,
          agenda: payload.agenda,
          notes: payload.notes,
          meeting_link: payload.meeting_link,
        })
        payload.source = 'google_calendar'
        payload.calendar_event_id = googleEvent.calendarEventId
        payload.meeting_link = googleEvent.meetingLink
        payload.sync_status = 'ready'
      } catch {
        // Google push failed — save locally anyway
        payload.sync_status = 'error'
      }
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        ...payload,
        status: input.status ?? 'scheduled',
        owner_id: optionalText(input.owner_id) ?? user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) {
      if (isMissingMeetingSyncColumnError(error)) {
        const { data: legacyData, error: legacyError } = await supabase
          .from('meetings')
          .insert({
            ...legacyMeetingPayload(payload),
            status: input.status ?? 'scheduled',
            owner_id: optionalText(input.owner_id) ?? user.id,
            created_by: user.id,
          })
          .select('id')
          .single()

        if (legacyError) throw legacyError
        revalidateResource(['/internal/meetings'])
        return { id: legacyData.id }
      }
      throw error
    }
    revalidateResource(['/internal/meetings'])

    // Send email notification to attendees (fire-and-forget)
    if (payload.attendees.length > 0) {
      sendMeetingNotification({
        title: payload.title,
        scheduled_at: payload.scheduled_at,
        duration_minutes: payload.duration_minutes,
        attendees: payload.attendees,
        agenda: payload.agenda,
        meeting_link: payload.meeting_link,
        organizer_name: user.email ?? undefined,
      }).catch(() => {})
    }

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

    if (error) {
      if (isMissingMeetingSyncColumnError(error)) {
        const { error: legacyError } = await supabase
          .from('meetings')
          .update({
            ...legacyMeetingPayload(meetingPayload(input)),
            status: input.status ?? 'scheduled',
            owner_id: optionalText(input.owner_id) ?? user.id,
          })
          .eq('id', id)

        if (legacyError) throw legacyError
        revalidateResource(['/internal/meetings', `/internal/meetings/${id}`])
        return { id }
      }
      throw error
    }
    revalidateResource(['/internal/meetings', `/internal/meetings/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function deleteMeeting(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) throw error
    revalidateResource(['/internal/meetings'])
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

export async function createBusinessVertical(input: BusinessVerticalFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('business_verticals')
      .insert({
        ...businessVerticalPayload(input),
        owner_id: user.id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/business-verticals'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateBusinessVertical(id: string, input: BusinessVerticalFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('business_verticals')
      .update(businessVerticalPayload(input))
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/business-verticals', `/internal/business-verticals/${id}`])
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
        currency: optionalText(input.currency) ?? 'INR',
        monthly_cost: optionalNumber(input.monthly_cost),
        billing_cycle: input.billing_cycle ?? 'monthly',
        renewal_date: optionalText(input.renewal_date),
        owner: optionalText(input.owner),
        notes: optionalText(input.notes),
        status: input.status ?? 'active',
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
        currency: optionalText(input.currency) ?? 'INR',
        monthly_cost: optionalNumber(input.monthly_cost),
        billing_cycle: input.billing_cycle ?? 'monthly',
        renewal_date: optionalText(input.renewal_date),
        owner: optionalText(input.owner),
        notes: optionalText(input.notes),
        status: input.status ?? 'active',
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
        related_vertical_id: optionalText(input.related_vertical_id),
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
        related_vertical_id: optionalText(input.related_vertical_id),
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

export async function createApplication(input: ApplicationFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...applicationPayload(input),
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (error) throw error
    revalidateResource(['/internal/applications'])
    return { id: data.id }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateApplication(id: string, input: ApplicationFormInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('applications')
      .update(applicationPayload(input))
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/applications', `/internal/applications/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function archiveApplication(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)
    const { error } = await supabase
      .from('applications')
      .update({
        status: 'archived',
        stage: 'archived',
      })
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/applications', `/internal/applications/${id}`])
    return { id }
  } catch (error) {
    return toResult(error)
  }
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireInternalUser(supabase)

    const { error: sourceError } = await supabase
      .from('source_registry')
      .delete()
      .eq('related_application_id', id)

    if (sourceError) throw sourceError

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidateResource(['/internal/applications', `/internal/applications/${id}`])
    return { id }
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
    related_vertical_id: optionalText(input.related_vertical_id),
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
    related_vertical_id: optionalText(input.related_vertical_id),
    source: input.source ?? 'manual',
    calendar_event_id: optionalText(input.calendar_event_id),
    meeting_link: optionalText(input.meeting_link),
    notes: optionalText(input.notes),
    sync_status: input.sync_status ?? 'not_connected',
  }
}

function legacyMeetingPayload(input: ReturnType<typeof meetingPayload>) {
  return {
    title: input.title,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    lead_id: input.lead_id,
    deal_id: input.deal_id,
    customer_id: input.customer_id,
    project_id: input.project_id,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    attendees: input.attendees,
    agenda: input.agenda,
    outcome: input.outcome,
    next_action: input.next_action,
  }
}

function isMissingMeetingSyncColumnError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const typed = error as SupabaseErrorLike
  const message = `${typed.code ?? ''} ${typed.message ?? ''} ${typed.details ?? ''} ${typed.hint ?? ''}`.toLowerCase()
  return (
    message.includes('meetings.source') ||
    message.includes('meetings.calendar_event_id') ||
    message.includes('meetings.meeting_link') ||
    message.includes('meetings.notes') ||
    message.includes('meetings.sync_status') ||
    message.includes("column 'source'") ||
    message.includes("column 'calendar_event_id'") ||
    message.includes("column 'meeting_link'") ||
    message.includes("column 'notes'") ||
    message.includes("column 'sync_status'") ||
    message.includes('schema cache')
  )
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
    currency: optionalText(input.currency) ?? 'INR',
    category: optionalText(input.category),
    status: input.status ?? 'paid',
    vendor_id: optionalText(input.vendor_id),
    project_id: optionalText(input.project_id),
    customer_id: optionalText(input.customer_id),
    ai_workspace_app_id: optionalText(input.ai_workspace_app_id),
    related_vertical_id: optionalText(input.related_vertical_id),
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

function businessVerticalPayload(input: BusinessVerticalFormInput) {
  return {
    name: requiredText(input.name, 'Name'),
    slug: optionalText(input.slug) ?? slugify(input.name),
    type: input.type,
    status: input.status,
    description: optionalText(input.description),
    owner: optionalText(input.owner),
    website: optionalText(input.website),
    logo_url: optionalText(input.logo_url),
    brand_color: optionalText(input.brand_color),
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

function applicationPayload(input: ApplicationFormInput) {
  return {
    name: requiredText(input.name, 'Application name'),
    slug: optionalText(input.slug) ?? slugify(input.name),
    description: optionalText(input.description),
    vertical_id: optionalText(input.vertical_id),
    stage: input.stage,
    status: input.status,
    type: input.type,
    repo_url: optionalText(input.repo_url),
    local_folder_path: optionalText(input.local_folder_path),
    docs_url: optionalText(input.docs_url),
    docs_folder_path: optionalText(input.docs_folder_path),
    website_url: optionalText(input.website_url),
    deployment_url: optionalText(input.deployment_url),
    database_url: optionalText(input.database_url),
    n8n_workflow_url: optionalText(input.n8n_workflow_url),
    figma_url: optionalText(input.figma_url),
    tech_stack: optionalTextArray(input.tech_stack),
    build_status: optionalText(input.build_status),
    next_action: optionalText(input.next_action),
    notes: optionalText(input.notes),
  }
}
