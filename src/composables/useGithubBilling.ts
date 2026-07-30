/**
 * Fetches *real* GitHub Copilot AI-credit usage from the Enhanced Billing
 * Platform REST API (as opposed to the interaction-based estimation in
 * `useAiCreditsEstimate`).
 *
 * Endpoint (scope-dependent):
 *   GET /organizations/{slug}/settings/billing/ai_credit/usage
 *   GET /enterprises/{slug}/settings/billing/ai_credit/usage
 *   GET /users/{slug}/settings/billing/ai_credit/usage
 *
 * The response carries the billed AI-credit quantities and dollar amounts
 * broken down by model, so totals are exact (no multiplier heuristic).
 *
 * Notes:
 *  - The request runs directly from the browser against `api.github.com`, so a
 *    token is required and is kept in-memory only (never persisted) to avoid
 *    leaking credentials. Non-sensitive settings persist in sessionStorage.
 *  - A configurable API base URL allows pointing at GHES or a CORS proxy.
 */
import { computed, ref } from 'vue'
import type {
  AiCreditUsageItem,
  AiCreditUsageResponse,
  BillingModelRow,
  BillingScope,
  BillingTotals,
  BillingTimePeriod
} from '@/types/billing'

const SETTINGS_KEY = 'github-billing-settings'
/**
 * Same-origin reverse proxy to api.github.com (configured in nginx.conf for
 * production and vite.config.ts for dev). Using a relative path sidesteps the
 * browser CORS restrictions of calling api.github.com directly. Override with
 * `https://api.github.com` in the UI to bypass the proxy, or point at a GHES host.
 */
const DEFAULT_API_BASE_URL = '/github-api'
const API_VERSION = '2026-03-10'

interface PersistedSettings {
  scope: BillingScope
  slug: string
  apiBaseUrl: string
  year: number
  month: number
  userFilter: string
  orgFilter: string
}

function loadSettings(): Partial<PersistedSettings> {
  try {
    const raw = sessionStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw) as Partial<PersistedSettings>
  } catch (e) {
    console.warn('Failed to load billing settings:', e)
  }
  return {}
}

const now = new Date()
const persisted = loadSettings()

// ── Shared settings (module-level so the form and results stay in sync) ──────

const scope = ref<BillingScope>(persisted.scope ?? 'organization')
const slug = ref(persisted.slug ?? '')
const apiBaseUrl = ref(persisted.apiBaseUrl ?? DEFAULT_API_BASE_URL)
const year = ref(persisted.year ?? now.getFullYear())
const month = ref(persisted.month ?? now.getMonth() + 1)
const userFilter = ref(persisted.userFilter ?? '')
/** Organization filter, only used for the enterprise scope. */
const orgFilter = ref(persisted.orgFilter ?? '')
/** Kept in-memory only — never written to storage. */
const token = ref('')

// ── Request state ────────────────────────────────────────────────────────────

const loading = ref(false)
const error = ref<string | null>(null)
const usageItems = ref<AiCreditUsageItem[]>([])
const timePeriod = ref<BillingTimePeriod | null>(null)
const hasResult = ref(false)

function persistSettings(): void {
  try {
    const payload: PersistedSettings = {
      scope: scope.value,
      slug: slug.value,
      apiBaseUrl: apiBaseUrl.value,
      year: year.value,
      month: month.value,
      userFilter: userFilter.value,
      orgFilter: orgFilter.value
    }
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn('Failed to persist billing settings:', e)
  }
}

function buildUrl(): string {
  const base = apiBaseUrl.value.replace(/\/+$/, '')
  const safeSlug = encodeURIComponent(slug.value.trim())
  const segment =
    scope.value === 'organization'
      ? `organizations/${safeSlug}`
      : scope.value === 'enterprise'
        ? `enterprises/${safeSlug}`
        : `users/${safeSlug}`

  const params = new URLSearchParams()
  params.set('year', String(year.value))
  params.set('month', String(month.value))
  // The ai_credit/usage endpoint accepts `user` for both org and enterprise
  // scopes, and `organization` for the enterprise scope only.
  const trimmedUser = userFilter.value.trim()
  if (trimmedUser && scope.value !== 'user') params.set('user', trimmedUser)
  const trimmedOrg = orgFilter.value.trim()
  if (trimmedOrg && scope.value === 'enterprise') params.set('organization', trimmedOrg)

  return `${base}/${segment}/settings/billing/ai_credit/usage?${params.toString()}`
}

async function fetchUsage(): Promise<void> {
  if (!slug.value.trim()) {
    error.value = 'Please provide an organization, enterprise or user slug.'
    return
  }
  if (!token.value.trim()) {
    error.value = 'A GitHub token with billing read access is required.'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await fetch(buildUrl(), {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.value.trim()}`,
        'X-GitHub-Api-Version': API_VERSION
      }
    })

    if (!response.ok) {
      throw new Error(await describeHttpError(response))
    }

    const data = (await response.json()) as AiCreditUsageResponse
    usageItems.value = Array.isArray(data.usageItems) ? data.usageItems : []
    timePeriod.value = data.timePeriod ?? null
    hasResult.value = true
    persistSettings()
  } catch (e) {
    hasResult.value = false
    usageItems.value = []
    timePeriod.value = null
    error.value = formatFetchError(e)
    console.error('Billing usage fetch failed:', e)
  } finally {
    loading.value = false
  }
}

async function describeHttpError(response: Response): Promise<string> {
  let detail = ''
  try {
    const body = (await response.json()) as { message?: string }
    if (body?.message) detail = ` — ${body.message}`
  } catch {
    /* response had no JSON body */
  }

  // A 404 on billing routes is GitHub hiding a resource the token cannot see.
  // The cause is almost always token scoping/permissions rather than a wrong path.
  const notFoundHints: Record<string, string> = {
    enterprise:
      'Not found. Verify the enterprise slug (the URL slug, not the display name). Enterprise billing usually needs a classic PAT with the read:enterprise / manage_billing:enterprise scope — fine-grained tokens often return 404 here. Also confirm the enterprise is on the enhanced billing platform.',
    organization:
      'Not found. The token must be a fine-grained PAT whose resource owner is THIS organization, with the "Plan" organization permission set to Read-only, and you must be an org admin. A token scoped to your personal account returns 404 here.',
    user: 'Not found. The token must belong to this user and have billing read access. Only personal Copilot plans expose user-level usage.'
  }
  const notFoundHint = notFoundHints[scope.value] ?? notFoundHints.organization!

  const hints: Record<number, string> = {
    401: 'Bad credentials. Check the token value and that it has not expired.',
    403: 'Forbidden. The token needs billing read access and you must be an admin or billing manager.',
    404: notFoundHint
  }
  const hint = hints[response.status] ? ` ${hints[response.status]}` : ''
  return `HTTP ${response.status} ${response.statusText}${detail}.${hint}`
}

function formatFetchError(e: unknown): string {
  if (e instanceof TypeError) {
    // fetch() throws TypeError on network/CORS failures.
    return 'Network or CORS error. The GitHub billing API may not allow browser requests from this origin; consider routing through a proxy (API base URL).'
  }
  return e instanceof Error ? e.message : 'Unknown error'
}

function clearResult(): void {
  usageItems.value = []
  timePeriod.value = null
  hasResult.value = false
  error.value = null
}

export function useGithubBilling() {
  // ── Aggregations ────────────────────────────────────────────────────────────

  const byModel = computed<BillingModelRow[]>(() => {
    const map = new Map<string, BillingModelRow>()
    for (const item of usageItems.value) {
      const key = item.model || item.sku || 'unknown'
      const existing = map.get(key)
      if (existing) {
        existing.netCredits += item.netQuantity
        existing.grossCredits += item.grossQuantity
        existing.netAmount += item.netAmount
        existing.grossAmount += item.grossAmount
        existing.discountAmount += item.discountAmount
      } else {
        map.set(key, {
          model: item.model || item.sku || 'unknown',
          product: item.product,
          netCredits: item.netQuantity,
          grossCredits: item.grossQuantity,
          netAmount: item.netAmount,
          grossAmount: item.grossAmount,
          discountAmount: item.discountAmount
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.netAmount - a.netAmount)
  })

  const totals = computed<BillingTotals>(() => {
    const rows = byModel.value
    return {
      modelCount: rows.length,
      grossCredits: rows.reduce((s, r) => s + r.grossCredits, 0),
      netCredits: rows.reduce((s, r) => s + r.netCredits, 0),
      grossAmount: rows.reduce((s, r) => s + r.grossAmount, 0),
      netAmount: rows.reduce((s, r) => s + r.netAmount, 0),
      discountAmount: rows.reduce((s, r) => s + r.discountAmount, 0)
    }
  })

  return {
    // settings
    scope,
    slug,
    apiBaseUrl,
    token,
    year,
    month,
    userFilter,
    orgFilter,
    // request state
    loading,
    error,
    hasResult,
    usageItems,
    timePeriod,
    // derived
    byModel,
    totals,
    // actions
    fetchUsage,
    clearResult
  }
}
