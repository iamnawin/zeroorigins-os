export const TERMINAL_STATUSES = {
  ideas: ['archived', 'rejected'],
  projects: ['archived', 'cancelled'],
  tasks: ['done', 'cancelled'],
  leads: ['archived', 'lost'],
  partners: ['archived', 'rejected'],
  proposals: ['accepted', 'rejected', 'expired'],
} as const

export type ResourceType = keyof typeof TERMINAL_STATUSES

export function terminalStatusFilter(type: ResourceType): string {
  return `(${TERMINAL_STATUSES[type].join(',')})`
}
