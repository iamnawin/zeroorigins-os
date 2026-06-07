export type Role =
  | 'SUPER_ADMIN'
  | 'FOUNDER'
  | 'DIRECTOR'
  | 'STAFF'
  | 'CONTRACTOR'
  | 'CUSTOMER'
  | 'PARTNER'
  | 'REFERRAL_PARTNER'

export const INTERNAL_ROLES: Role[] = ['SUPER_ADMIN', 'FOUNDER', 'DIRECTOR', 'STAFF', 'CONTRACTOR']
export const EXTERNAL_ROLES: Role[] = ['CUSTOMER', 'PARTNER', 'REFERRAL_PARTNER']

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

export const CUSTOMER_REQUEST_STATUSES = ['submitted', 'under_review', 'discovery_call', 'proposal_shared', 'approved', 'in_progress', 'review', 'delivered', 'support', 'closed'] as const
export type CustomerRequestStatus = typeof CUSTOMER_REQUEST_STATUSES[number]

export type Visibility = 'internal' | 'customer_visible' | 'partner_visible'
export type AssetVisibility = 'internal' | 'customer_visible' | 'partner_visible' | 'public'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
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
  status: 'active' | 'inactive' | 'churned'
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
