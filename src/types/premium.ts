// Types for GitHub Copilot premium request consumption

export type MultiplierVersion = 'current' | 'new'

export type CopilotPlanId = 'free' | 'pro' | 'pro_plus' | 'business' | 'enterprise' | 'custom'

export type PeriodMode = 'all' | 'current_month'

export interface CopilotPlan {
  id: CopilotPlanId
  label: string
  monthlyQuota: number
}

export interface ModelMultiplier {
  /** Canonical model id, used as key. */
  id: string
  /** Human-readable display name. */
  displayName: string
  /** Aliases that may appear in raw NDJSON data (lowercased). */
  aliases: string[]
  /** Multiplier currently in effect at GitHub. */
  current: number
  /** Upcoming multiplier announced by GitHub. */
  new: number
}

export interface PremiumSettings {
  planId: CopilotPlanId
  customQuota: number
  multiplierVersion: MultiplierVersion
  /** User overrides keyed by model id, applied on top of current/new presets. */
  overrides: Record<string, { current?: number; new?: number }>
  /** Optional override of the unknown/auto fallback multiplier. */
  unknownMultiplier: number
  /** Period scoping for the premium-request calculation. */
  periodMode: PeriodMode
}

export interface PremiumModelUsage {
  modelId: string
  displayName: string
  interactions: number
  multiplier: number
  premiumRequests: number
  isUnknown: boolean
}

export interface UserPremiumUsage {
  user_login: string
  user_id: number
  total_interactions: number
  premium_requests: number
  by_model: PremiumModelUsage[]
}

export type PremiumTierId =
  | 'inactive'
  | '0_30'
  | '30_60'
  | '60_80'
  | '80_100'
  | 'over_100'

export interface PremiumTier {
  id: PremiumTierId
  label: string
  color: string
  /** Inclusive lower bound of the tier in % of monthly quota. */
  min: number
  /** Exclusive upper bound; `Infinity` for the last tier. */
  max: number
  users: UserPremiumUsage[]
  count: number
}
