import { computed } from 'vue'
import type { CopilotMetric } from '@/types/copilot'
import type {
  PremiumModelUsage,
  PremiumTier,
  PremiumTierId,
  UserPremiumUsage
} from '@/types/premium'
import { useCopilotMetrics } from '@/composables/useCopilotMetrics'
import { usePremiumSettings } from '@/composables/usePremiumSettings'
import { buildAliasIndex, MODEL_REGISTRY, UNKNOWN_MODEL_ID } from '@/constants/premiumModels'

interface RawModelAggregate {
  rawName: string
  interactions: number
}

const ALIAS_INDEX = buildAliasIndex()

function aggregateInteractionsByModel(metrics: CopilotMetric[]): Map<string, RawModelAggregate> {
  const totals = new Map<string, RawModelAggregate>()
  for (const metric of metrics) {
    if (!metric.totals_by_model_feature) continue
    for (const entry of metric.totals_by_model_feature) {
      const key = entry.model.toLowerCase()
      const existing = totals.get(key)
      if (existing) {
        existing.interactions += entry.user_initiated_interaction_count
      } else {
        totals.set(key, {
          rawName: entry.model,
          interactions: entry.user_initiated_interaction_count
        })
      }
    }
  }
  return totals
}

/** YYYY-MM-DD parser; returns a Date in the local timezone (no time shift). */
function parseDay(day: string): Date | null {
  const parts = day.split('-')
  if (parts.length !== 3) return null
  const [y, m, d] = parts.map(Number)
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
  return new Date(y, m - 1, d)
}

function isInCurrentMonth(day: string, ref = new Date()): boolean {
  const date = parseDay(day)
  if (!date) return false
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth()
}

function daysInMonth(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function usePremiumRequests() {
  const { metrics } = useCopilotMetrics()
  const { settings, monthlyQuota, getMultiplier } = usePremiumSettings()

  /** Metrics filtered by current `periodMode` setting. */
  const scopedMetrics = computed<CopilotMetric[]>(() => {
    if (settings.value.periodMode === 'current_month') {
      return metrics.value.filter((m) => isInCurrentMonth(m.day))
    }
    return metrics.value
  })

  /** First / last day actually covered by the dataset (after scoping). */
  const dataRange = computed<{ start: string | null; end: string | null }>(() => {
    if (scopedMetrics.value.length === 0) return { start: null, end: null }
    let start = scopedMetrics.value[0]!.day
    let end = scopedMetrics.value[0]!.day
    for (const m of scopedMetrics.value) {
      if (m.day < start) start = m.day
      if (m.day > end) end = m.day
    }
    return { start, end }
  })

  /** Number of distinct days covered by the (scoped) dataset. */
  const periodDays = computed<number>(() => {
    const days = new Set(scopedMetrics.value.map((m) => m.day))
    return Math.max(1, days.size)
  })

  /**
   * Reference number of days in the period to project from.
   * - In `all` mode: number of distinct days with data.
   * - In `current_month` mode: same (i.e. only days actually elapsed and
   *   covered by data), so projection extrapolates to the full calendar month.
   */
  const projectionDenominator = computed<number>(() => periodDays.value)

  /**
   * Number of days the projection targets.
   * - `all` mode: 30 days (canonical month).
   * - `current_month` mode: total days of the current calendar month.
   */
  const projectionTarget = computed<number>(() => {
    if (settings.value.periodMode === 'current_month') {
      return daysInMonth(new Date())
    }
    return 30
  })

  /** Resolve raw model aggregates -> usage breakdown using current settings. */
  function buildBreakdown(metrics: CopilotMetric[]): PremiumModelUsage[] {
    const totals = aggregateInteractionsByModel(metrics)
    const breakdown: PremiumModelUsage[] = []
    const unknownAggregate = { interactions: 0, rawNames: new Set<string>() }

    for (const [key, agg] of totals.entries()) {
      const entry = ALIAS_INDEX.get(key)
      if (!entry) {
        unknownAggregate.interactions += agg.interactions
        unknownAggregate.rawNames.add(agg.rawName)
        continue
      }
      const multiplier = getMultiplier(entry.id) ?? 0
      breakdown.push({
        modelId: entry.id,
        displayName: entry.displayName,
        interactions: agg.interactions,
        multiplier,
        premiumRequests: agg.interactions * multiplier,
        isUnknown: false
      })
    }

    if (unknownAggregate.interactions > 0) {
      const multiplier = settings.value.unknownMultiplier
      const firstName = Array.from(unknownAggregate.rawNames)[0] ?? 'unknown'
      const label =
        unknownAggregate.rawNames.size === 1
          ? firstName
          : `Other (${unknownAggregate.rawNames.size} models)`
      breakdown.push({
        modelId: UNKNOWN_MODEL_ID,
        displayName: label,
        interactions: unknownAggregate.interactions,
        multiplier,
        premiumRequests: unknownAggregate.interactions * multiplier,
        isUnknown: true
      })
    }

    return breakdown.sort((a, b) => b.premiumRequests - a.premiumRequests)
  }

  /** Premium usage aggregated by user across the (scoped) dataset. */
  const usageByUser = computed<UserPremiumUsage[]>(() => {
    const grouped = new Map<string, CopilotMetric[]>()
    for (const m of scopedMetrics.value) {
      const arr = grouped.get(m.user_login)
      if (arr) arr.push(m)
      else grouped.set(m.user_login, [m])
    }

    const result: UserPremiumUsage[] = []
    for (const [login, userMetrics] of grouped.entries()) {
      const first = userMetrics[0]
      if (!first) continue
      const breakdown = buildBreakdown(userMetrics)
      const premium = breakdown.reduce((sum, b) => sum + b.premiumRequests, 0)
      const interactions = breakdown.reduce((sum, b) => sum + b.interactions, 0)
      result.push({
        user_login: login,
        user_id: first.user_id,
        total_interactions: interactions,
        premium_requests: premium,
        by_model: breakdown
      })
    }

    return result.sort((a, b) => b.premium_requests - a.premium_requests)
  })

  /** Total premium requests consumed across all users on the report period. */
  const totalPremiumRequests = computed<number>(() =>
    usageByUser.value.reduce((sum, u) => sum + u.premium_requests, 0)
  )

  /** Global breakdown by model across (scoped) data. */
  const globalBreakdown = computed<PremiumModelUsage[]>(() => buildBreakdown(scopedMetrics.value))

  /**
   * Distribution of users across consumption tiers (vs monthly quota).
   * Tier boundaries are inclusive on the lower bound, exclusive on the upper.
   * Users with zero premium requests fall into the dedicated `inactive` tier
   * regardless of percentage math.
   */
  const usersByTier = computed<PremiumTier[]>(() => {
    const definitions: Omit<PremiumTier, 'users' | 'count'>[] = [
      {
        id: 'inactive',
        label: 'Inactif (0%)',
        color: 'var(--color-text-muted)',
        min: 0,
        max: 0
      },
      { id: '0_30', label: '0-30%', color: '#3fb950', min: 0, max: 30 },
      { id: '30_60', label: '30-60%', color: '#238636', min: 30, max: 60 },
      { id: '60_80', label: '60-80%', color: '#d29922', min: 60, max: 80 },
      { id: '80_100', label: '80-100%', color: '#e3b341', min: 80, max: 100 },
      { id: 'over_100', label: '+100%', color: '#f85149', min: 100, max: Infinity }
    ]

    const buckets = new Map<PremiumTierId, UserPremiumUsage[]>()
    for (const def of definitions) {
      buckets.set(def.id, [])
    }

    for (const user of usageByUser.value) {
      if (user.premium_requests === 0) {
        buckets.get('inactive')!.push(user)
        continue
      }
      if (!monthlyQuota.value) {
        buckets.get('inactive')!.push(user)
        continue
      }
      const pct = (projectMonthly(user.premium_requests) / monthlyQuota.value) * 100
      let placed = false
      for (const def of definitions) {
        if (def.id === 'inactive') continue
        const inRange = def.max === Infinity ? pct >= def.min : pct >= def.min && pct < def.max
        if (inRange) {
          buckets.get(def.id)!.push(user)
          placed = true
          break
        }
      }
      if (!placed) {
        buckets.get('over_100')!.push(user)
      }
    }

    return definitions.map((def) => {
      const users = buckets.get(def.id) ?? []
      return { ...def, users, count: users.length }
    })
  })

  /** Lookup helpers ------------------------------------------------------ */

  function getUsageForUser(userLogin: string): UserPremiumUsage | undefined {
    return usageByUser.value.find((u) => u.user_login === userLogin)
  }

  /**
   * Project the period total to its full target window:
   * - `all` mode: extrapolate to a 30-day canonical month
   * - `current_month` mode: extrapolate the elapsed month to its end
   */
  function projectMonthly(periodValue: number): number {
    const ratio = projectionTarget.value / projectionDenominator.value
    return periodValue * ratio
  }

  /** All registry entries (current effective multiplier applied). */
  const registryWithMultipliers = computed(() =>
    MODEL_REGISTRY.map((entry) => ({
      ...entry,
      effective: getMultiplier(entry.id) ?? 0
    }))
  )

  return {
    periodDays,
    projectionTarget,
    dataRange,
    monthlyQuota,
    usageByUser,
    usersByTier,
    totalPremiumRequests,
    globalBreakdown,
    getUsageForUser,
    projectMonthly,
    registryWithMultipliers
  }
}
