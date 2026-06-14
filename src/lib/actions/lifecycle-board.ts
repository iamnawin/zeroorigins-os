'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ApplicationStage, ApplicationStatus, BusinessIdeaStatus } from '@/types'

export type LifecycleColumnId =
  | 'ideas'
  | 'evaluating'
  | 'experiment'
  | 'prototype'
  | 'application'
  | 'production_ready'
  | 'live'
  | 'archived'

export type LifecycleCardType = 'idea' | 'application'

type MoveLifecycleCardInput = {
  cardType: LifecycleCardType
  cardId: string
  fromColumn: LifecycleColumnId
  toColumn: LifecycleColumnId
}

type PromoteIdeaInput = {
  ideaId: string
  applicationName: string
  verticalId?: string
  initialStage?: Extract<ApplicationStage, 'prototype' | 'mvp' | 'application'>
  ownerId?: string
  nextAction?: string
  existingApplicationId?: string
}

type RevertApplicationInput = {
  applicationId: string
  targetIdeaStatus?: Extract<BusinessIdeaStatus, 'evaluating' | 'experiment'>
  confirmedStrong?: boolean
}

type ActionResult = {
  id?: string
  applicationId?: string
  ideaId?: string
  error?: string
  requiresConfirmation?: boolean
}

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function moveLifecycleCard(input: MoveLifecycleCardInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)

    if (input.fromColumn === input.toColumn) return { id: input.cardId }

    if (input.cardType === 'idea') {
      if (input.toColumn === 'application') {
        return { id: input.cardId, requiresConfirmation: true }
      }

      const nextStatus = ideaStatusForColumn(input.toColumn)
      if (!nextStatus) throw new Error('Ideas can only move through Ideas, Evaluating, Experiment, Prototype, Application, or Archived.')

      const { data: idea, error: fetchError } = await supabase
        .from('business_ideas')
        .select('id, title, status')
        .eq('id', input.cardId)
        .single()
      if (fetchError) throw fetchError
      if (!idea) throw new Error('Idea not found.')

      const { error } = await supabase
        .from('business_ideas')
        .update({ status: nextStatus })
        .eq('id', input.cardId)
      if (error) throw error

      await logLifecycleActivity(supabase, user.id, `Idea moved from ${labelForColumn(input.fromColumn)} to ${labelForColumn(input.toColumn)}`, 'business_idea', input.cardId, {
        fromColumn: input.fromColumn,
        toColumn: input.toColumn,
        fromStatus: idea.status,
        toStatus: nextStatus,
      })

      revalidateLifecycle()
      return { id: input.cardId }
    }

    const { data: app, error: fetchError } = await supabase
      .from('applications')
      .select('id, name, stage, status, deployment_url, website_url, source_idea_id')
      .eq('id', input.cardId)
      .single()
    if (fetchError) throw fetchError
    if (!app) throw new Error('Application not found.')

    if (input.toColumn === 'ideas' || input.toColumn === 'evaluating' || input.toColumn === 'experiment') {
      if (!['experiment', 'prototype', 'mvp', 'application', 'concept'].includes(app.stage)) {
        throw new Error('Only experiment, prototype, MVP, or application-stage records can be reverted to earlier idea stages.')
      }
      return { id: input.cardId, requiresConfirmation: true }
    }

    const nextStage = applicationStageForColumn(input.toColumn)
    const nextStatus = applicationStatusForColumn(input.toColumn)
    if (!nextStage) throw new Error('Applications cannot move into that lifecycle column.')
    if (input.toColumn === 'archived' && app.stage === 'live') {
      throw new Error('Live applications need manual review before archive.')
    }

    const { error } = await supabase
      .from('applications')
      .update({ stage: nextStage, status: nextStatus })
      .eq('id', input.cardId)
    if (error) throw error

    await logLifecycleActivity(supabase, user.id, applicationMoveMessage(input.fromColumn, input.toColumn), 'application', input.cardId, {
      fromColumn: input.fromColumn,
      toColumn: input.toColumn,
      fromStage: app.stage,
      toStage: nextStage,
      fromStatus: app.status,
      toStatus: nextStatus,
      hasDeployment: Boolean(app.deployment_url || app.website_url),
    })

    revalidateLifecycle()
    return { id: input.cardId }
  } catch (error) {
    return toResult(error)
  }
}

export async function promoteIdeaToApplication(input: PromoteIdeaInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data: idea, error: ideaError } = await supabase
      .from('business_ideas')
      .select('id, title, description, vertical_id, owner_id, status, promoted_application_id, linked_application_id')
      .eq('id', input.ideaId)
      .single()
    if (ideaError) throw ideaError
    if (!idea) throw new Error('Idea not found.')

    const applicationId = input.existingApplicationId
      ? await linkExistingApplication(supabase, input.existingApplicationId, idea.id)
      : await createApplicationFromIdea(supabase, {
        name: requiredText(input.applicationName || idea.title, 'Application name'),
        description: idea.description,
        verticalId: input.verticalId || idea.vertical_id,
        ownerId: input.ownerId || idea.owner_id || user.id,
        stage: input.initialStage || 'prototype',
        nextAction: input.nextAction,
        sourceIdeaId: idea.id,
      })

    const { error: updateError } = await supabase
      .from('business_ideas')
      .update({
        status: 'promoted_to_application',
        promoted_application_id: applicationId,
        linked_application_id: applicationId,
        promoted_at: new Date().toISOString(),
        promoted_by: user.id,
      })
      .eq('id', idea.id)
    if (updateError) throw updateError

    await logLifecycleActivity(supabase, user.id, 'Idea promoted to Application', 'business_idea', idea.id, {
      applicationId,
      fromStatus: idea.status,
      toStatus: 'promoted_to_application',
      promoted_at: new Date().toISOString(),
      promoted_by: user.id,
    })
    await logLifecycleActivity(supabase, user.id, 'Application created from idea', 'application', applicationId, {
      sourceIdeaId: idea.id,
    })

    revalidateLifecycle()
    return { id: idea.id, ideaId: idea.id, applicationId }
  } catch (error) {
    return toResult(error)
  }
}

export async function revertApplicationToIdea(input: RevertApplicationInput): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const user = await requireInternalUser(supabase)
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id, name, stage, status, source_idea_id, deployment_url, website_url')
      .eq('id', input.applicationId)
      .single()
    if (appError) throw appError
    if (!app) throw new Error('Application not found.')

    const hasPublicSurface = Boolean(app.deployment_url || app.website_url)
    if (['production_ready', 'live'].includes(app.stage) || hasPublicSurface) {
      if (!input.confirmedStrong) {
        return { id: app.id, requiresConfirmation: true, error: 'This application has production or public surface. Strong confirmation is required.' }
      }
    }
    if (!['concept', 'experiment', 'prototype', 'mvp', 'application'].includes(app.stage)) {
      throw new Error('This application cannot be reverted to an idea from its current lifecycle stage.')
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: 'reverted_to_idea' as ApplicationStatus, stage: 'reverted_to_idea' as ApplicationStage })
      .eq('id', app.id)
    if (updateError) throw updateError

    if (app.source_idea_id) {
      const { error: ideaError } = await supabase
        .from('business_ideas')
        .update({ status: input.targetIdeaStatus || 'evaluating' })
        .eq('id', app.source_idea_id)
      if (ideaError) throw ideaError
    }

    await logLifecycleActivity(supabase, user.id, 'Application reverted to Idea', 'application', app.id, {
      sourceIdeaId: app.source_idea_id,
      fromStage: app.stage,
      toStage: 'reverted_to_idea',
      targetIdeaStatus: input.targetIdeaStatus || 'evaluating',
    })

    revalidateLifecycle()
    return { id: app.id, applicationId: app.id, ideaId: app.source_idea_id ?? undefined }
  } catch (error) {
    return toResult(error)
  }
}

async function createApplicationFromIdea(
  supabase: Supabase,
  input: {
    name: string
    description?: string | null
    verticalId?: string | null
    ownerId?: string | null
    stage: Extract<ApplicationStage, 'prototype' | 'mvp' | 'application'>
    nextAction?: string
    sourceIdeaId: string
  },
) {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      vertical_id: input.verticalId || null,
      stage: input.stage,
      status: 'active',
      type: 'application',
      owner_id: input.ownerId || null,
      next_action: input.nextAction || null,
      source_idea_id: input.sourceIdeaId,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

async function linkExistingApplication(supabase: Supabase, applicationId: string, ideaId: string) {
  const { error } = await supabase
    .from('applications')
    .update({ source_idea_id: ideaId })
    .eq('id', applicationId)
  if (error) throw error
  return applicationId
}

async function logLifecycleActivity(
  supabase: Supabase,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  })
  if (error) throw error
}

async function requireInternalUser(supabase: Supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('You must be signed in to move lifecycle cards.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', user.id)
    .single()
  if (profileError) throw profileError
  if (!profile || !['admin', 'employee'].includes(profile.role) || profile.status !== 'active') {
    throw new Error('Your account does not have access to update lifecycle records.')
  }
  return user
}

function ideaStatusForColumn(column: LifecycleColumnId): BusinessIdeaStatus | null {
  if (column === 'ideas') return 'idea'
  if (column === 'evaluating') return 'evaluating'
  if (column === 'experiment') return 'experiment'
  if (column === 'prototype') return 'prototype'
  if (column === 'archived') return 'archived'
  return null
}

function applicationStageForColumn(column: LifecycleColumnId): ApplicationStage | null {
  if (column === 'prototype') return 'prototype'
  if (column === 'application') return 'application'
  if (column === 'production_ready') return 'production_ready'
  if (column === 'live') return 'live'
  if (column === 'archived') return 'archived'
  return null
}

function applicationStatusForColumn(column: LifecycleColumnId): ApplicationStatus {
  return column === 'archived' ? 'archived' : 'active'
}

function applicationMoveMessage(from: LifecycleColumnId, to: LifecycleColumnId) {
  if (to === 'live') return 'Application moved to Live'
  if (to === 'archived') return 'Application archived'
  return `Application moved from ${labelForColumn(from)} to ${labelForColumn(to)}`
}

function labelForColumn(column: LifecycleColumnId) {
  return column.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function revalidateLifecycle() {
  revalidatePath('/internal/applications')
  revalidatePath('/internal/ideas')
  revalidatePath('/internal/business-verticals')
}

function requiredText(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label} is required.`)
  return trimmed
}

function slugify(value: string) {
  return requiredText(value, 'Name')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toResult(error: unknown): ActionResult {
  if (error instanceof Error) return { error: error.message }
  if (error && typeof error === 'object' && 'message' in error) {
    const typed = error as { message?: string; details?: string; hint?: string }
    return { error: [typed.message, typed.details, typed.hint].filter(Boolean).join(' ') }
  }
  return { error: 'Something went wrong while moving the card.' }
}
