export type Role =
  | 'admin'
  | 'employee'
  | 'CUSTOMER'
  | 'PARTNER'
  | 'REFERRAL_PARTNER'

export const INTERNAL_ROLES: Role[] = ['admin', 'employee']
export const EXTERNAL_ROLES: Role[] = ['CUSTOMER', 'PARTNER', 'REFERRAL_PARTNER']

export const PROFILE_STATUSES = ['active', 'pending', 'disabled'] as const
export type ProfileStatus = typeof PROFILE_STATUSES[number]

export const CALENDAR_PROVIDERS = ['none', 'google'] as const
export type CalendarProvider = typeof CALENDAR_PROVIDERS[number]

export const CALENDAR_SYNC_STATUSES = ['not_connected', 'ready', 'paused', 'error'] as const
export type CalendarSyncStatus = typeof CALENDAR_SYNC_STATUSES[number]

export const BUSINESS_VERTICAL_TYPES = ['brand', 'product', 'education', 'media', 'internal', 'client_service', 'experiment', 'lab', 'video', 'creative_tech', 'product_studio', 'service', 'other'] as const
export type BusinessVerticalType = typeof BUSINESS_VERTICAL_TYPES[number]

export const BUSINESS_VERTICAL_STATUSES = ['idea', 'active', 'paused', 'archived'] as const
export type BusinessVerticalStatus = typeof BUSINESS_VERTICAL_STATUSES[number]

export const AI_ASSIST_INTENTS = [
  'create_task', 'schedule_meeting', 'draft_reply', 'summarize_email', 'create_followup',
  'create_project', 'create_proposal', 'create_idea', 'promote_idea_to_application', 'create_application',
  'query_emails', 'query_tasks', 'query_projects', 'query_ideas', 'query_applications', 'query_verticals',
  'find_missing_sources', 'update_application_source', 'sync_repo_details', 'summarize_today', 'unknown',
] as const
export type AiAssistIntent = typeof AI_ASSIST_INTENTS[number]

export const AI_ASSIST_STATUSES = ['draft', 'confirmed', 'created', 'failed', 'cancelled'] as const
export type AiAssistStatus = typeof AI_ASSIST_STATUSES[number]

export type ZoAgentMode = 'draft' | 'query' | 'summary' | 'action'

export interface ZoAgentOutput {
  intent: AiAssistIntent
  mode: ZoAgentMode
  title: string
  summary: string
  confidence: number
  requires_confirmation: boolean
  draft?: Record<string, unknown>
  query?: Record<string, unknown>
  next_actions?: string[]
  warnings?: string[]
}

export interface ZoAgentQueryResult {
  id: string
  title: string
  subtitle?: string
  badge?: string
  href?: string
}

export const BUSINESS_IDEA_STATUSES = ['raw', 'reviewing', 'validated', 'testing', 'tested', 'rejected', 'archived', 'promoted_to_application'] as const
export type BusinessIdeaStatus = typeof BUSINESS_IDEA_STATUSES[number]

export const BUSINESS_IDEA_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
export type BusinessIdeaPriority = typeof BUSINESS_IDEA_PRIORITIES[number]

export const APPLICATION_STAGES = ['concept', 'prototype', 'testing', 'production_ready', 'live', 'paused', 'archived'] as const
export type ApplicationStage = typeof APPLICATION_STAGES[number]

export const APPLICATION_STATUSES = ['active', 'paused', 'archived'] as const
export type ApplicationStatus = typeof APPLICATION_STATUSES[number]

export const APPLICATION_TYPES = ['application', 'product', 'internal_system', 'automation', 'website', 'tool', 'service_product', 'other'] as const
export type ApplicationType = typeof APPLICATION_TYPES[number]

export const SOURCE_TYPES = ['ideas_root', 'repos_root', 'repo', 'local_folder', 'docs', 'deployment', 'website', 'figma', 'n8n', 'supabase', 'google_drive', 'other'] as const
export type SourceType = typeof SOURCE_TYPES[number]

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const
export type CurrencyCode = typeof CURRENCIES[number]

export const IDEA_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'on_hold', 'converted_to_project', 'archived'] as const
export type IdeaStatus = typeof IDEA_STATUSES[number]

export const PROJECT_STATUSES = ['draft', 'planned', 'active', 'blocked', 'in_review', 'delivered', 'paused', 'cancelled', 'archived'] as const
export type ProjectStatus = typeof PROJECT_STATUSES[number]

export const TASK_STATUSES = ['todo', 'in_progress', 'waiting', 'blocked', 'review', 'done', 'cancelled'] as const
export type TaskStatus = typeof TASK_STATUSES[number]

export const LEAD_STATUSES = ['new', 'contacted', 'discovery_scheduled', 'discovery_done', 'proposal_needed', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold', 'archived'] as const
export type LeadStatus = typeof LEAD_STATUSES[number]

export const PARTNER_STATUSES = ['new_application', 'under_review', 'call_scheduled', 'approved', 'rejected', 'active', 'paused', 'archived'] as const
export type PartnerStatus = typeof PARTNER_STATUSES[number]

export const PROPOSAL_STATUSES = ['draft', 'internal_review', 'sent', 'viewed', 'accepted', 'rejected', 'revision_requested', 'expired'] as const
export type ProposalStatus = typeof PROPOSAL_STATUSES[number]

export const CUSTOMER_STATUSES = ['active', 'inactive', 'churned'] as const
export type CustomerStatus = typeof CUSTOMER_STATUSES[number]

export const CUSTOMER_REQUEST_STATUSES = ['submitted', 'under_review', 'discovery_call', 'proposal_shared', 'approved', 'in_progress', 'review', 'delivered', 'support', 'closed'] as const
export type CustomerRequestStatus = typeof CUSTOMER_REQUEST_STATUSES[number]

export const AI_APP_STATUSES = ['idea', 'planned', 'in_progress', 'mvp_ready', 'testing', 'deployed', 'broken', 'paused', 'archived', 'ready_to_sell', 'client_demo', 'active', 'live', 'delivered'] as const
export type AIAppStatus = typeof AI_APP_STATUSES[number]

export const AI_APP_CATEGORIES = ['internal_tool', 'client_demo', 'saas_product', 'automation', 'ai_agent', 'content_system', 'salesforce_tool', 'marketing_tool', 'data_tool', 'experimental', 'repo', 'idea', 'brand', 'media', 'delivered', 'live'] as const
export type AIAppCategory = typeof AI_APP_CATEGORIES[number]

export const AI_APP_TYPES = ['web_app', 'chrome_extension', 'desktop_app', 'n8n_workflow', 'ai_agent', 'website', 'api', 'mobile_app', 'automation_script', 'content_pipeline', 'nextjs_app', 'vite_app', 'node_app', 'python_app', 'salesforce_app', 'documentation_or_concept', 'media_project', 'workspace_folder'] as const
export type AIAppType = typeof AI_APP_TYPES[number]

export const AI_FOLDER_GROUPS = ['Ideas', 'Experiments', 'Projects', 'Repos', 'Tools', 'Media', 'Video-Outputs', 'Delivered', 'Live', 'Backups', 'Sandbox', 'Temp', 'Brands'] as const
export type AIFolderGroup = typeof AI_FOLDER_GROUPS[number]

export const DEAL_STAGES = ['qualifying', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'] as const
export type DealStage = typeof DEAL_STAGES[number]

export const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'] as const
export type MeetingStatus = typeof MEETING_STATUSES[number]

export const FINANCE_TRANSACTION_STATUSES = ['planned', 'due', 'paid', 'overdue', 'cancelled'] as const
export type FinanceTransactionStatus = typeof FINANCE_TRANSACTION_STATUSES[number]

export const FINANCE_CATEGORIES = ['hosting', 'ai_api', 'software', 'domain', 'contractor', 'marketing', 'operations', 'project_cost', 'tax', 'other'] as const
export type FinanceCategory = typeof FINANCE_CATEGORIES[number]

export const VENDOR_CATEGORIES = ['software', 'ai_tool', 'cloud_hosting', 'domain_website', 'marketing', 'design', 'legal_compliance', 'finance_tax', 'hardware', 'other'] as const
export type VendorCategory = typeof VENDOR_CATEGORIES[number]

export const RECURRENCE_INTERVALS = ['none', 'monthly', 'quarterly', 'yearly'] as const
export type RecurrenceInterval = typeof RECURRENCE_INTERVALS[number]

export type Visibility = 'internal' | 'customer_visible' | 'partner_visible'
export type AssetVisibility = 'internal' | 'customer_visible' | 'partner_visible' | 'public'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  title?: string
  status: ProfileStatus
  calendar_email?: string
  calendar_provider?: CalendarProvider
  calendar_sync_enabled?: boolean
  calendar_sync_status?: CalendarSyncStatus
  avatar_url?: string
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  type: 'internal' | 'customer' | 'partner' | 'vendor'
  website?: string
  contact_email?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Idea {
  id: string
  title: string
  description: string
  status: IdeaStatus
  priority?: 'low' | 'medium' | 'high' | 'critical'
  owner_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  priority?: 'low' | 'medium' | 'high' | 'critical'
  owner_id: string
  created_by: string
  customer_id?: string
  related_vertical_id?: string
  customer_visible_summary?: string
  start_date?: string
  target_date?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  project_id?: string
  related_vertical_id?: string
  assigned_to?: string
  owner_id: string
  created_by: string
  customer_visible: boolean
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  name: string
  email: string
  company?: string
  source?: string
  status: LeadStatus
  notes?: string
  service_interest?: string
  budget_range?: string
  phone?: string
  whatsapp?: string
  website?: string
  source_detail?: string
  preferred_contact_method?: string
  preferred_call_time?: string
  last_contacted_at?: string
  automation_status?: string
  automation_source?: string
  n8n_workflow_id?: string
  external_reference_id?: string
  ai_summary?: string
  ai_score?: number
  qualification_notes?: string
  owner_id?: string
  related_vertical_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Partner {
  id: string
  name: string
  email: string
  company?: string
  type?: string
  status: PartnerStatus
  pitch?: string
  notes?: string
  phone?: string
  whatsapp?: string
  website?: string
  linkedin?: string
  source_detail?: string
  automation_status?: string
  automation_source?: string
  n8n_workflow_id?: string
  external_reference_id?: string
  ai_summary?: string
  ai_score?: number
  qualification_notes?: string
  owner_id?: string
  created_by?: string
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  email: string
  company?: string
  organization_id?: string
  lead_id?: string
  profile_id?: string
  status: CustomerStatus
  notes?: string
  phone?: string
  website?: string
  owner_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  title: string
  content?: string
  status: ProposalStatus
  lead_id?: string
  customer_id?: string
  project_id?: string
  deal_id?: string
  related_vertical_id?: string
  amount?: number
  service_type?: string
  scope?: string
  timeline?: string
  proposal_url?: string
  internal_notes?: string
  customer_visible_notes?: string
  sent_at?: string
  expires_at?: string
  owner_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  name: string
  lead_id?: string
  stage: DealStage
  estimated_value?: number
  expected_close_date?: string
  owner_id?: string
  next_step?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  title: string
  entity_type: 'lead' | 'deal' | 'customer' | 'project' | 'partner' | 'internal'
  entity_id?: string
  lead_id?: string
  deal_id?: string
  customer_id?: string
  project_id?: string
  scheduled_at: string
  start_time?: string
  end_time?: string
  source?: 'manual' | 'google_calendar'
  calendar_event_id?: string
  duration_minutes: number
  attendees?: string[]
  meeting_link?: string
  agenda?: string
  notes?: string
  sync_status?: CalendarSyncStatus
  outcome?: string
  next_action?: string
  status: MeetingStatus
  related_vertical_id?: string
  owner_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export const KNOWLEDGE_CATEGORIES = [
  'project_document',
  'company_policy',
  'brand_collateral',
  'course_material',
  'client_requirement',
  'meeting_note',
  'decision',
  'sop_playbook',
  'finance_vendor_document',
  'automation_note',
  'product_spec',
] as const
export type KnowledgeCategory = typeof KNOWLEDGE_CATEGORIES[number]

export interface KnowledgeArticle {
  id: string
  title: string
  content?: string
  category?: KnowledgeCategory | string
  tags?: string[]
  owner_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  website?: string
  contact_email?: string
  category?: VendorCategory | FinanceCategory | string
  currency?: CurrencyCode | string
  monthly_cost?: number
  billing_cycle?: RecurrenceInterval | string
  renewal_date?: string
  owner?: string
  notes?: string
  status?: 'active' | 'paused' | 'cancelled'
  owner_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface FinanceTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  description?: string
  category?: FinanceCategory | string
  status: FinanceTransactionStatus
  vendor_id?: string
  vendor?: Vendor
  project_id?: string
  customer_id?: string
  ai_workspace_app_id?: string
  related_vertical_id?: string
  date?: string
  due_date?: string
  paid_at?: string
  invoice_url?: string
  receipt_url?: string
  recurrence_interval?: RecurrenceInterval
  next_due_date?: string
  notes?: string
  owner_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AIWorkspaceApp {
  id: string
  name: string
  slug?: string
  description?: string
  category?: AIAppCategory
  app_type?: AIAppType
  status: AIAppStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  local_path?: string
  repo_path?: string
  github_url?: string
  vercel_url?: string
  live_url?: string
  prototype_url?: string
  website_url?: string
  brand_url?: string
  docs_url?: string
  tech_stack?: string[]
  folder_group?: AIFolderGroup
  owner?: string
  owner_id?: string
  created_by?: string
  is_client_demo: boolean
  is_sellable_product: boolean
  is_internal_tool: boolean
  is_open_source: boolean
  is_live: boolean
  is_delivered: boolean
  current_version?: string
  current_issue?: string
  next_action?: string
  blockers?: string
  business_value?: string
  target_user?: string
  monetization_idea?: string
  last_checked_at?: string
  last_synced_at?: string
  created_at: string
  updated_at: string
}

export interface BusinessVertical {
  id: string
  name: string
  slug: string
  type: BusinessVerticalType
  status: BusinessVerticalStatus
  description?: string
  owner?: string
  website?: string
  logo_url?: string
  brand_color?: string
  notes?: string
  owner_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AiAssistRequest {
  id: string
  user_id?: string
  intent: AiAssistIntent
  input_text: string
  ai_output_json: Record<string, unknown>
  status: AiAssistStatus
  related_vertical_id?: string
  related_idea_id?: string
  related_application_id?: string
  related_task_id?: string
  related_meeting_id?: string
  related_lead_id?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface BusinessIdea {
  id: string
  title: string
  slug?: string
  description?: string
  vertical_id?: string
  status: BusinessIdeaStatus
  priority: BusinessIdeaPriority
  source?: string
  local_folder_path?: string
  owner_id?: string
  ai_summary?: string
  next_action?: string
  promoted_application_id?: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
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
  owner_id?: string
  tech_stack: string[]
  build_status?: string
  last_synced_at?: string
  source_idea_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SourceRegistryEntry {
  id: string
  name: string
  source_type: SourceType
  local_path?: string
  source_url?: string
  related_vertical_id?: string
  related_idea_id?: string
  related_application_id?: string
  status: 'active' | 'paused' | 'archived'
  last_checked_at?: string
  last_synced_at?: string
  notes?: string
  metadata_json?: Record<string, unknown>
  created_at: string
  updated_at: string
}
