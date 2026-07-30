<script setup lang="ts">
import { computed } from 'vue'
import { useGithubBilling } from '@/composables/useGithubBilling'
import type { BillingScope } from '@/types/billing'

const {
  scope,
  slug,
  apiBaseUrl,
  token,
  year,
  month,
  userFilter,
  orgFilter,
  loading,
  error,
  hasResult,
  timePeriod,
  byModel,
  totals,
  fetchUsage,
  clearResult
} = useGithubBilling()

const scopeOptions: { id: BillingScope; label: string; placeholder: string }[] = [
  { id: 'organization', label: 'Organization', placeholder: 'my-org' },
  { id: 'enterprise', label: 'Enterprise', placeholder: 'my-enterprise' },
  { id: 'user', label: 'User', placeholder: 'octocat' }
]

const slugPlaceholder = computed(
  () => scopeOptions.find((o) => o.id === scope.value)?.placeholder ?? ''
)

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const currentYear = new Date().getFullYear()
const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

const num0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const num2 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function fmt0(v: number): string {
  return num0.format(v)
}
function fmt2(v: number): string {
  return num2.format(v)
}
function fmtUsd(v: number): string {
  return usd.format(v)
}

const periodLabel = computed(() => {
  const tp = timePeriod.value
  if (!tp) return ''
  const monthName = tp.month ? MONTHS[tp.month - 1] : ''
  return [monthName, tp.year].filter(Boolean).join(' ')
})

function onSubmit() {
  fetchUsage()
}
</script>

<template>
  <div class="billing-view">
    <div class="breadcrumb">
      <RouterLink to="/">Dashboard</RouterLink>
      <span class="breadcrumb-separator">/</span>
      <span>Billing usage (API)</span>
    </div>

    <div class="page-header">
      <div>
        <h1 class="page-title">
          AI credits — billing API
          <span class="page-subtitle">
            Exact AI-credit usage pulled live from GitHub's Enhanced Billing Platform
            (not the interaction-based estimate)
          </span>
        </h1>
      </div>
    </div>

    <!-- Configuration form -->
    <form class="config-card" @submit.prevent="onSubmit">
      <div class="field">
        <span class="field-label">Scope</span>
        <div class="scope-picker">
          <button
            v-for="opt in scopeOptions"
            :key="opt.id"
            type="button"
            class="scope-btn"
            :class="{ active: scope === opt.id }"
            @click="scope = opt.id"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="fields-grid">
        <label class="field">
          <span class="field-label">{{ scopeOptions.find((o) => o.id === scope)?.label }} slug</span>
          <input v-model="slug" class="text-input" :placeholder="slugPlaceholder" autocomplete="off" />
        </label>

        <label class="field">
          <span class="field-label">GitHub token</span>
          <input
            v-model="token"
            type="password"
            class="text-input"
            placeholder="ghp_… / github_pat_…"
            autocomplete="off"
          />
        </label>

        <label class="field">
          <span class="field-label">Year</span>
          <select v-model.number="year" class="text-input">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Month</span>
          <select v-model.number="month" class="text-input">
            <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
          </select>
        </label>

        <label v-if="scope === 'enterprise'" class="field">
          <span class="field-label">
            Organization filter <span class="field-optional">optional</span>
          </span>
          <input
            v-model="orgFilter"
            class="text-input"
            placeholder="filter by org login"
            autocomplete="off"
          />
        </label>

        <label class="field" :class="{ disabled: scope === 'user' }">
          <span class="field-label">
            User filter <span class="field-optional">optional</span>
          </span>
          <input
            v-model="userFilter"
            class="text-input"
            placeholder="filter by login"
            autocomplete="off"
            :disabled="scope === 'user'"
          />
        </label>

        <label class="field">
          <span class="field-label">
            API base URL <span class="field-optional">advanced</span>
          </span>
          <input v-model="apiBaseUrl" class="text-input" placeholder="/github-api" autocomplete="off" />
        </label>
      </div>

      <div class="actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="btn-spinner"></span>
          {{ loading ? 'Fetching…' : 'Fetch usage' }}
        </button>
        <button v-if="hasResult" type="button" class="btn-secondary" @click="clearResult">
          Clear
        </button>
      </div>

      <p class="config-note">
        Calls route through the built-in <code>/github-api</code> reverse proxy (nginx in
        production, Vite in dev) to avoid CORS. The token stays in memory only (never stored),
        needs billing read access, and you must be an admin or billing manager. Requires the
        enhanced billing platform.
      </p>

      <p v-if="scope === 'enterprise'" class="config-hint">
        Enterprise tip: use the enterprise <strong>URL slug</strong> (not the display name), and a
        <strong>classic PAT</strong> with <code>read:enterprise</code> /
        <code>manage_billing:enterprise</code>. Fine-grained tokens frequently return a 404 on
        enterprise billing routes.
      </p>
      <p v-else-if="scope === 'organization'" class="config-hint">
        Organization tip: use a <strong>fine-grained PAT</strong> whose <strong>resource owner is
        this organization</strong>, with the <strong>Organization → "Plan" → Read-only</strong>
        permission, and be an org admin. A token scoped to your personal account returns a 404.
      </p>
      <p v-else class="config-hint">
        User tip: the token must belong to this user and have billing read access. Only personal
        Copilot plans expose user-level AI-credit usage.
      </p>
    </form>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm-.75-2.25a.75.75 0 101.5 0 .75.75 0 00-1.5 0zM8 4a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 008 4z"
        />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Results -->
    <template v-if="hasResult">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card-label">AI credits billed</span>
          <span class="stat-card-value blue">{{ fmt0(totals.netCredits) }}</span>
          <span class="stat-card-trend">{{ fmt0(totals.grossCredits) }} gross</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Net amount</span>
          <span class="stat-card-value green">{{ fmtUsd(totals.netAmount) }}</span>
          <span class="stat-card-trend">{{ fmtUsd(totals.grossAmount) }} gross</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Discounts</span>
          <span class="stat-card-value yellow">{{ fmtUsd(totals.discountAmount) }}</span>
          <span class="stat-card-trend">applied to gross</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Models</span>
          <span class="stat-card-value purple">{{ totals.modelCount }}</span>
          <span class="stat-card-trend">{{ periodLabel || '—' }}</span>
        </div>
      </div>

      <div class="dashboard-card">
        <div class="dashboard-card-header">
          <div>
            <h3 class="dashboard-card-title">Usage by model</h3>
            <p class="dashboard-card-subtitle">
              <template v-if="periodLabel">Billed AI credits for {{ periodLabel }}. </template>
              Exact figures reported by GitHub billing.
            </p>
          </div>
        </div>

        <table class="billing-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Product</th>
              <th class="num">Gross credits</th>
              <th class="num">Net credits</th>
              <th class="num">Discount</th>
              <th class="num">Net amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in byModel" :key="row.model">
              <td class="model-name">{{ row.model }}</td>
              <td class="product">{{ row.product }}</td>
              <td class="num">{{ fmt2(row.grossCredits) }}</td>
              <td class="num">{{ fmt2(row.netCredits) }}</td>
              <td class="num">{{ row.discountAmount ? fmtUsd(row.discountAmount) : '—' }}</td>
              <td class="num strong">{{ fmtUsd(row.netAmount) }}</td>
            </tr>
            <tr v-if="byModel.length === 0">
              <td colspan="6" class="empty">No AI-credit usage for this period.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Empty / intro state -->
    <div v-else-if="!error" class="intro-card">
      <p>
        Enter a scope, slug and token, then fetch to compare GitHub's exact billed
        AI-credit figures with the dashboard's interaction-based estimate.
      </p>
      <a
        href="https://docs.github.com/en/rest/billing/usage"
        target="_blank"
        rel="noopener"
        class="info-link"
      >
        Billing usage REST API documentation
      </a>
    </div>
  </div>
</template>

<style scoped>
.billing-view {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* ── Config form ──────────────────────────────────────────────────────────── */

.config-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field.disabled {
  opacity: 0.55;
}

.field-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.field-optional {
  margin-left: 0.25rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.text-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-family: var(--font-family);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-accent-blue);
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.3);
}

.scope-picker {
  display: flex;
  gap: 0.375rem;
}

.scope-btn {
  padding: 0.375rem 0.875rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scope-btn.active {
  background-color: var(--color-accent-blue);
  border-color: var(--color-accent-blue);
  color: white;
}

.scope-btn:not(.active):hover {
  border-color: var(--color-accent-blue);
  color: var(--color-text-primary);
}

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background-color: var(--color-accent-blue);
  border: 1px solid var(--color-accent-blue);
  border-radius: var(--radius-md);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  color: var(--color-text-primary);
  border-color: var(--color-accent-blue);
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.config-note {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.config-note code,
.config-hint code {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  padding: 0.05rem 0.3rem;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.config-hint {
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-accent-yellow);
  padding: 0.625rem 0.875rem;
  background-color: rgba(210, 153, 34, 0.08);
  border: 1px solid rgba(210, 153, 34, 0.3);
  border-radius: var(--radius-md);
}

.config-hint strong {
  color: var(--color-text-primary);
}

/* ── Error ────────────────────────────────────────────────────────────────── */

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: rgba(248, 81, 73, 0.1);
  border: 1px solid var(--color-accent-red);
  border-radius: var(--radius-md);
  color: var(--color-accent-red);
  margin-bottom: 1.5rem;
}

/* ── Table ────────────────────────────────────────────────────────────────── */

.billing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.billing-table thead th {
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.billing-table th.num,
.billing-table td.num {
  text-align: right;
  font-family: var(--font-mono);
}

.billing-table tbody td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border-muted, var(--color-border));
  color: var(--color-text-secondary);
}

.billing-table tbody tr:hover td {
  background-color: var(--color-bg-tertiary);
}

.model-name {
  color: var(--color-text-primary);
  font-weight: 600;
}

.product {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.strong {
  font-weight: 700;
  color: var(--color-text-primary);
}

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

/* ── Intro ────────────────────────────────────────────────────────────────── */

.intro-card {
  padding: 1.5rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-accent-blue);
  text-decoration: none;
  font-weight: 500;
}

.info-link:hover {
  text-decoration: underline;
}
</style>
