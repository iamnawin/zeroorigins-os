export type RadarScoreTier = 'low' | 'medium' | 'high'

export function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(10, Math.round(num)))
}

export function scoreTier(score: number): RadarScoreTier {
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

export function isHighRelevance(relevanceScore: number): boolean {
  return relevanceScore >= 7
}
