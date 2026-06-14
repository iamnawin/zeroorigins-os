import type { Application, BusinessIdea } from '@/types'

export type LifecycleColumnId =
  | 'ideas'
  | 'evaluating'
  | 'experiment'
  | 'prototype'
  | 'application'
  | 'production_ready'
  | 'live'
  | 'archived'

export type DropZoneState = 'idle' | 'active' | 'valid' | 'invalid'

export type LifecycleCardType = 'idea' | 'application'

export type LifecycleIdea = BusinessIdea & {
  vertical?: { id: string; name: string } | null
  owner?: { full_name?: string | null; email?: string | null } | null
  linked_application?: { id: string; name: string } | null
  promoted_application?: { id: string; name: string } | null
}

export type LifecycleApplication = Application & {
  vertical?: { id: string; name: string } | null
  owner?: { full_name?: string | null; email?: string | null } | null
  source_idea?: { id: string; title: string } | null
}

export type LifecycleCard =
  | { type: 'idea'; item: LifecycleIdea }
  | { type: 'application'; item: LifecycleApplication }

export type LifecycleColumn = {
  id: LifecycleColumnId
  label: string
  description: string
}
