/**
 * Aggregates GitHub Copilot AI-credit consumption and cost under the
 * usage-based billing model (active June 1 2026, 1 AI credit = $0.01 USD).
 *
 * Prefer the official `ai_credits_used` field when present in the NDJSON
 * export. Fall back to an interaction × model-multiplier estimate for older
 * exports that do not carry official credits:
 *
 *   estimated credits = Σ(model interactions × model AI-credit multiplier)
 *   cost              = credits × $0.01
 *
 * Official credits are not broken down by model in the export, so per-model
 * rows remain interaction-based estimates. Daily trends grouped by user use
 * official credits when available.
 *
 * Plan quotas (pooled per billing entity):
 *   Copilot Business:   1 900 AI credits / user / month (promo 3 000, Jun–Sep 2026)
 *   Copilot Enterprise: 3 900 AI credits / user / month (promo 7 000, Jun–Sep 2026)
 */
import { computed, ref } from 'vue'
import { buildAliasIndex, MODEL_REGISTRY } from '@/constants/premiumModels'
import { useCopilotMetrics } from './useCopilotMetrics'

/** 1 AI credit costs $0.01 USD under the new usage-based pricing. */
export const AI_CREDIT_USD = 0.01

// ── Plan definitions ─────────────────────────────────────────────────────────

export interface AiCreditsPlan {
  id: string
  label: string
  /** Standard monthly AI credits per user. */
  creditsPerUser: number
  /** Promotional credits (June–September 2026 for existing customers). */
  promoCreditsPerUser: number
}

export const AI_CREDITS_PLANS: AiCreditsPlan[] = [
  {
    id: 'business',
    label: 'Copilot Business',
    creditsPerUser: 1_900,
    promoCreditsPerUser: 3_000
  },
  {
    id: 'enterprise',
    label: 'Copilot Enterprise',
    creditsPerUser: 3_900,
    promoCreditsPerUser: 7_000
  }
]

export const DEFAULT_AI_CREDITS_PLAN = 'business'

/** Fallback AI-credit multiplier for unrecognised models (auto / others / …). */
export const DEFAULT_UNKNOWN_MULTIPLIER = 1

// ── Row shapes ────────────────────────────────────────────────────────────────

export interface AiCreditsModelRow {
  modelId: string
  displayName: string
  interactions: number
  /** AI credits for this model (estimated from interactions × multiplier). */
  aiCredits: number
  /** Cost in USD for this model (from estimated credits). */
  costUsd: number
  /** Whether the model was recognised in the registry. */
  isUnknown: boolean
}

export interface AiCreditsUserRow {
  login: string
  interactions: number
  /** Total cost in USD. */
  costUsd: number
  /** AI credits consumed (official when available, else estimated). */
  aiCredits: number
  /** AI credits within the per-user quota. */
  includedCredits: number
  /** AI credits over the per-user quota (billable additional usage). */
  overageCredits: number
  /** Cost in USD of the overage credits. */
  overageCostUsd: number
  /** True when this user's credits come from official `ai_credits_used`. */
  isOfficial: boolean
  byModel: AiCreditsModelRow[]
}

export interface AiCreditsTotals {
  userCount: number
  totalInteractions: number
  totalCostUsd: number
  totalAiCredits: number
  includedQuota: number
  overageCredits: number
  overageCostUsd: number
  quotaUsedPct: number
  /** True when the export carries official `ai_credits_used` values. */
  isOfficial: boolean
}

/** A single day with cost (USD) keyed by model id or user login. */
export interface DailyCostMatrix {
  date: string
  costs: Record<string, number>
}

export interface TrendSeries {
  labels: string[]
  series: { key: string; label: string; data: number[] }[]
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const ALIAS_INDEX = buildAliasIndex()

const OTHER_KEY = '__other__'

interface ResolvedModel {
  id: string
  displayName: string
  multiplier: number
  isUnknown: boolean
}

// ── Shared settings (module-level singletons so every caller stays in sync) ──

const planId = ref(DEFAULT_AI_CREDITS_PLAN)
const usePromo = ref(true)
/** Fallback AI-credit multiplier for unrecognised models (auto/unknown/…). */
const unknownMultiplier = ref(DEFAULT_UNKNOWN_MULTIPLIER)

export function useAiCreditsEstimate() {
  const { metrics } = useCopilotMetrics()

  const selectedPlan = computed<AiCreditsPlan>(
    () => AI_CREDITS_PLANS.find((p) => p.id === planId.value) ?? AI_CREDITS_PLANS[0]!
  )

  const creditsPerUser = computed(() =>
    usePromo.value
      ? selectedPlan.value.promoCreditsPerUser
      : selectedPlan.value.creditsPerUser
  )

  // ── Model resolution ──────────────────────────────────────────────────────

  function resolveModel(rawModel: string): ResolvedModel {
    const entry = ALIAS_INDEX.get(rawModel.toLowerCase())
    if (entry) {
      return {
        id: entry.id,
        displayName: entry.displayName,
        multiplier: entry.new,
        isUnknown: false
      }
    }
    return {
      id: rawModel || 'unknown',
      displayName: rawModel || 'Unknown',
      multiplier: unknownMultiplier.value,
      isUnknown: true
    }
  }

  // ── Core aggregation (single pass over all metrics) ─────────────────────────

  interface Aggregation {
    userMap: Map<
      string,
      {
        interactions: number
        aiCredits: number
        isOfficial: boolean
        models: Map<string, AiCreditsModelRow>
      }
    >
    modelMap: Map<string, AiCreditsModelRow>
    dailyModel: Map<string, Record<string, number>>
    dailyUser: Map<string, Record<string, number>>
    dates: Set<string>
    hasOfficialCredits: boolean
  }

  const aggregation = computed<Aggregation>(() => {
    const userMap: Aggregation['userMap'] = new Map()
    const modelMap = new Map<string, AiCreditsModelRow>()
    const dailyModel = new Map<string, Record<string, number>>()
    const dailyUser = new Map<string, Record<string, number>>()
    const dates = new Set<string>()
    let hasOfficialCredits = false

    for (const metric of metrics.value) {
      const login = metric.user_login
      const day = metric.day
      dates.add(day)

      if (!userMap.has(login)) {
        userMap.set(login, {
          interactions: 0,
          aiCredits: 0,
          isOfficial: false,
          models: new Map()
        })
      }
      const user = userMap.get(login)!

      const dayModelRow = dailyModel.get(day) ?? {}
      const dayUserRow = dailyUser.get(day) ?? {}

      let estimatedCredits = 0

      for (const mf of metric.totals_by_model_feature ?? []) {
        const interactions = mf.user_initiated_interaction_count
        if (!interactions) continue

        const resolved = resolveModel(mf.model)
        const credits = interactions * resolved.multiplier
        const cost = credits * AI_CREDIT_USD
        estimatedCredits += credits

        user.interactions += interactions

        const userModel = user.models.get(resolved.id)
        if (userModel) {
          userModel.interactions += interactions
          userModel.aiCredits += credits
          userModel.costUsd += cost
        } else {
          user.models.set(resolved.id, {
            modelId: resolved.id,
            displayName: resolved.displayName,
            interactions,
            aiCredits: credits,
            costUsd: cost,
            isUnknown: resolved.isUnknown
          })
        }

        const globalModel = modelMap.get(resolved.id)
        if (globalModel) {
          globalModel.interactions += interactions
          globalModel.aiCredits += credits
          globalModel.costUsd += cost
        } else {
          modelMap.set(resolved.id, {
            modelId: resolved.id,
            displayName: resolved.displayName,
            interactions,
            aiCredits: credits,
            costUsd: cost,
            isUnknown: resolved.isUnknown
          })
        }

        // Model daily matrix always uses estimated credits (no official breakdown)
        dayModelRow[resolved.id] = (dayModelRow[resolved.id] ?? 0) + credits
      }

      const hasOfficial = typeof metric.ai_credits_used === 'number'
      if (hasOfficial) hasOfficialCredits = true

      const dayCredits = hasOfficial ? (metric.ai_credits_used as number) : estimatedCredits
      user.aiCredits += dayCredits
      if (hasOfficial) user.isOfficial = true

      dayUserRow[login] = (dayUserRow[login] ?? 0) + dayCredits

      dailyModel.set(day, dayModelRow)
      dailyUser.set(day, dayUserRow)
    }

    return { userMap, modelMap, dailyModel, dailyUser, dates, hasOfficialCredits }
  })

  const hasOfficialCredits = computed(() => aggregation.value.hasOfficialCredits)

  // ── Public computed rows ────────────────────────────────────────────────────

  const byUser = computed<AiCreditsUserRow[]>(() => {
    const quota = creditsPerUser.value
    return Array.from(aggregation.value.userMap.entries())
      .map(([login, acc]) => {
        const aiCredits = acc.aiCredits
        const includedCredits = Math.min(aiCredits, quota)
        const overageCredits = Math.max(0, aiCredits - quota)
        const byModel = Array.from(acc.models.values()).sort(
          (a, b) => b.aiCredits - a.aiCredits
        )
        return {
          login,
          interactions: acc.interactions,
          aiCredits,
          costUsd: aiCredits * AI_CREDIT_USD,
          includedCredits,
          overageCredits,
          overageCostUsd: overageCredits * AI_CREDIT_USD,
          isOfficial: acc.isOfficial,
          byModel
        }
      })
      .sort((a, b) => b.aiCredits - a.aiCredits)
  })

  const byModel = computed<AiCreditsModelRow[]>(() =>
    Array.from(aggregation.value.modelMap.values()).sort(
      (a, b) => b.aiCredits - a.aiCredits
    )
  )

  const dates = computed<string[]>(() =>
    Array.from(aggregation.value.dates).sort((a, b) => a.localeCompare(b))
  )

  const totals = computed<AiCreditsTotals>(() => {
    const rows = byUser.value
    const userCount = rows.length
    const totalAiCredits = rows.reduce((s, u) => s + u.aiCredits, 0)
    const totalInteractions = rows.reduce((s, u) => s + u.interactions, 0)
    const includedQuota = userCount * creditsPerUser.value
    const overageCredits = Math.max(0, totalAiCredits - includedQuota)
    const quotaUsedPct = includedQuota > 0 ? (totalAiCredits / includedQuota) * 100 : 0
    return {
      userCount,
      totalInteractions,
      totalCostUsd: totalAiCredits * AI_CREDIT_USD,
      totalAiCredits,
      includedQuota,
      overageCredits,
      overageCostUsd: overageCredits * AI_CREDIT_USD,
      quotaUsedPct,
      isOfficial: aggregation.value.hasOfficialCredits
    }
  })

  const unknownModelNames = computed<string[]>(() => {
    const names = new Set<string>()
    for (const row of byModel.value) {
      if (row.isUnknown) names.add(row.displayName)
    }
    return Array.from(names).sort()
  })

  // ── Daily trend series (top-N + "All other") ────────────────────────────────

  /**
   * Build a Chart.js-ready set of daily cost (USD) series, grouped either by
   * model or by user. Keeps the `topN` highest consumers and rolls everything
   * else into an "All other" series, matching the GitHub native AI-usage view.
   *
   * When official credits are present, prefer grouping by user (model grouping
   * remains an interaction-based estimate only).
   */
  function buildTrendSeries(group: 'model' | 'user', topN = 5): TrendSeries {
    const labels = dates.value
    const matrix = group === 'model' ? aggregation.value.dailyModel : aggregation.value.dailyUser

    const ranked =
      group === 'model'
        ? byModel.value.map((m) => ({ key: m.modelId, label: m.displayName }))
        : byUser.value.map((u) => ({ key: u.login, label: u.login }))

    const top = ranked.slice(0, topN)
    const topKeys = new Set(top.map((t) => t.key))

    const series = top.map((t) => ({
      key: t.key,
      label: t.label,
      data: labels.map((d) => (matrix.get(d)?.[t.key] ?? 0) * AI_CREDIT_USD)
    }))

    const otherData = labels.map((d) => {
      const row = matrix.get(d)
      if (!row) return 0
      let sum = 0
      for (const [key, credits] of Object.entries(row)) {
        if (!topKeys.has(key)) sum += credits
      }
      return sum * AI_CREDIT_USD
    })

    if (otherData.some((v) => v > 0)) {
      series.push({ key: OTHER_KEY, label: 'All other', data: otherData })
    }

    return { labels, series }
  }

  const modelRegistry = computed(() =>
    MODEL_REGISTRY.map((e) => ({ ...e, effectiveMultiplier: e.new }))
  )

  return {
    planId,
    usePromo,
    unknownMultiplier,
    selectedPlan,
    creditsPerUser,
    byUser,
    byModel,
    dates,
    totals,
    hasOfficialCredits,
    unknownModelNames,
    modelRegistry,
    buildTrendSeries
  }
}
