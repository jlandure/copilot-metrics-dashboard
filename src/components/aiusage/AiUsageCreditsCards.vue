<script setup lang="ts">
import { computed } from 'vue'
import { useAiCreditsEstimate, AI_CREDITS_PLANS } from '@/composables/useAiCreditsEstimate'

const { planId, usePromo, creditsPerUser, totals } = useAiCreditsEstimate()

const num = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function fmt(v: number): string {
  return num.format(v)
}
function fmtUsd(v: number): string {
  return usd.format(v)
}

const includedConsumed = computed(() => Math.min(totals.value.totalAiCredits, totals.value.includedQuota))

const barPct = computed(() => {
  if (totals.value.includedQuota <= 0) return 0
  return Math.min(100, (totals.value.totalAiCredits / totals.value.includedQuota) * 100)
})

const barColor = computed(() => {
  const p = totals.value.quotaUsedPct
  if (p >= 100) return 'var(--color-accent-red)'
  if (p >= 80) return 'var(--color-accent-yellow)'
  return 'var(--color-accent-blue)'
})

const hasOverage = computed(() => totals.value.overageCredits > 0)

// ── Monthly reset note ────────────────────────────────────────────────────────

const resetInfo = computed(() => {
  const now = new Date()
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const days = Math.max(0, Math.ceil((reset.getTime() - now.getTime()) / 86_400_000))
  const dateLabel = reset.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  return { days, dateLabel }
})
</script>

<template>
  <div class="ai-usage-credits">
    <!-- Plan settings -->
    <div class="settings-row">
      <div class="settings-group">
        <span class="settings-label">Plan</span>
        <div class="plan-picker">
          <button
            v-for="plan in AI_CREDITS_PLANS"
            :key="plan.id"
            type="button"
            class="plan-btn"
            :class="{ active: planId === plan.id }"
            @click="planId = plan.id"
          >
            {{ plan.label }}
          </button>
        </div>
      </div>
      <label class="settings-group promo">
        <input v-model="usePromo" type="checkbox" class="settings-checkbox" />
        <span>
          Promo quota (Jun–Sep 2026)
          <span class="settings-hint">{{ fmt(creditsPerUser) }} credits/user</span>
        </span>
      </label>
    </div>

    <div class="cards">
      <!-- Included credits -->
      <div class="usage-card">
        <p class="card-label">Included credits</p>
        <p class="card-value">
          <span class="value-strong">{{ fmt(includedConsumed) }}</span>
          <span class="value-muted"> / {{ fmt(totals.includedQuota) }} AI credits</span>
        </p>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${barPct}%`, background: barColor }"></div>
        </div>
        <p class="card-sub">
          <template v-if="totals.isOfficial">Official AI credits from the usage report. </template>
          <template v-else>Estimated from model interactions. </template>
          Included AI credits consumed by Copilot users in your account. Monthly limit resets in
          {{ resetInfo.days }} days on {{ resetInfo.dateLabel }}.
        </p>
      </div>

      <!-- Additional usage -->
      <div class="usage-card">
        <div class="card-head-row">
          <p class="card-label">Additional usage</p>
          <span class="card-link">{{ hasOverage ? 'Billable' : 'Enable additional usage' }}</span>
        </div>
        <p class="card-value">
          <span v-if="hasOverage" class="value-strong value-warn">{{ fmtUsd(totals.overageCostUsd) }}</span>
          <span v-else class="value-strong">Not enabled</span>
        </p>
        <p class="card-sub">
          <template v-if="hasOverage">
            {{ fmt(totals.overageCredits) }} AI credits over the included allowance would be billed
            as additional usage.
          </template>
          <template v-else>
            If enabled, your enterprise will be billed for additional AI credits usage after your
            included credits have been exhausted.
          </template>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-usage-credits {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Settings ─────────────────────────────────────────────────────────────── */

.settings-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
}

.settings-group {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.settings-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.plan-picker {
  display: flex;
  gap: 0.375rem;
}

.plan-btn {
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

.plan-btn.active {
  background-color: var(--color-accent-blue);
  border-color: var(--color-accent-blue);
  color: white;
}

.plan-btn:not(.active):hover {
  border-color: var(--color-accent-blue);
  color: var(--color-text-primary);
}

.promo {
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.settings-checkbox {
  accent-color: var(--color-accent-blue);
  width: 14px;
  height: 14px;
}

.settings-hint {
  margin-left: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

/* ── Cards ────────────────────────────────────────────────────────────────── */

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.usage-card {
  padding: 1.25rem 1.5rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.card-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.card-link {
  font-size: 0.8125rem;
  color: var(--color-accent-blue);
  font-weight: 500;
}

.card-value {
  font-size: 1.75rem;
  line-height: 1.1;
  margin-bottom: 0.75rem;
}

.value-strong {
  font-weight: 700;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
}

.value-muted {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.value-warn {
  color: var(--color-accent-red);
}

.progress-track {
  height: 6px;
  background-color: var(--color-bg-primary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.card-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>
