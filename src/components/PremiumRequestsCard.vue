<script setup lang="ts">
import { computed } from 'vue'
import { usePremiumRequests } from '@/composables/usePremiumRequests'
import { usePremiumSettings } from '@/composables/usePremiumSettings'
import type { PremiumModelUsage } from '@/types/premium'

const props = defineProps<{
  userLogin: string
}>()

const emit = defineEmits<{
  (e: 'open-settings'): void
}>()

const { getUsageForUser, monthlyQuota, periodDays, projectMonthly, projectionTarget, dataRange } =
  usePremiumRequests()
const { currentPlan, settings } = usePremiumSettings()

const usage = computed(() => getUsageForUser(props.userLogin))

const consumedOnPeriod = computed(() => Math.round((usage.value?.premium_requests ?? 0) * 10) / 10)

const projectedMonthly = computed(() =>
  Math.round(projectMonthly(usage.value?.premium_requests ?? 0) * 10) / 10
)

const usagePercent = computed(() => {
  if (!monthlyQuota.value) return 0
  return Math.min(100, (projectedMonthly.value / monthlyQuota.value) * 100)
})

const status = computed<'safe' | 'warn' | 'danger'>(() => {
  const pct = usagePercent.value
  if (pct >= 100) return 'danger'
  if (pct >= 80) return 'warn'
  return 'safe'
})

const statusColor = computed(() => {
  if (status.value === 'danger') return 'var(--color-accent-red)'
  if (status.value === 'warn') return 'var(--color-accent-yellow)'
  return 'var(--color-accent-green)'
})

const statusLabel = computed(() => {
  if (status.value === 'danger') return 'Quota dépassé'
  if (status.value === 'warn') return 'Proche du quota'
  return 'Dans le quota'
})

const breakdown = computed<PremiumModelUsage[]>(() => usage.value?.by_model ?? [])

const versionLabel = computed(() =>
  settings.value.multiplierVersion === 'current'
    ? 'Multiplicateurs actuels'
    : 'Multiplicateurs à venir'
)

const periodLabel = computed(() => {
  const { start, end } = dataRange.value
  if (!start || !end) return ''
  if (start === end) return formatShortDate(start)
  return `${formatShortDate(start)} → ${formatShortDate(end)}`
})

const periodModeLabel = computed(() =>
  settings.value.periodMode === 'current_month'
    ? 'Mois en cours uniquement'
    : 'Toutes les données chargées'
)

const projectionLabel = computed(() =>
  settings.value.periodMode === 'current_month'
    ? `Projeté à fin ${formatMonthName(new Date())}`
    : 'Projeté à 30 jours'
)

function formatShortDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  if (!y || !m || !d) return day
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatMonthName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'long' })
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('fr-FR')
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

function formatMultiplier(value: number): string {
  if (value === 0) return '0×'
  if (Number.isInteger(value)) return `${value}×`
  return `${value.toFixed(2).replace(/\.?0+$/, '')}×`
}
</script>

<template>
  <div class="dashboard-card premium-card">
    <div class="dashboard-card-header">
      <div>
        <h3 class="dashboard-card-title">
          Premium Requests
          <span class="card-tag">estimation</span>
        </h3>
        <p class="dashboard-card-subtitle">
          {{ currentPlan.label }} · quota {{ formatNumber(monthlyQuota) }}/mois ·
          {{ versionLabel }}
        </p>
        <p v-if="periodLabel" class="period-info">
          <span class="period-pill">{{ periodModeLabel }}</span>
          <span class="period-range">Données : {{ periodLabel }}</span>
        </p>
      </div>
      <button class="settings-btn" type="button" @click="emit('open-settings')">
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path
            d="M8 0a8.2 8.2 0 01.701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 01-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 01-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 01-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 01-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 01-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 010-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 01.704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 000 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 001.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 000-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 00-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 00-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 00-1.142 0zM11 8a3 3 0 11-6 0 3 3 0 016 0zM9.5 8a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z"
          />
        </svg>
        Réglages
      </button>
    </div>

    <div v-if="!usage" class="empty-state">
      <p>Aucune donnée d'utilisation pour cet utilisateur.</p>
    </div>

    <template v-else>
      <div class="premium-summary">
        <div class="summary-block">
          <span class="block-label">Consommé sur la période</span>
          <span class="block-value">
            {{ formatNumber(consumedOnPeriod) }}
            <span class="block-unit">requêtes</span>
          </span>
          <span class="block-meta">{{ periodDays }} jours de données</span>
        </div>

        <div class="summary-block">
          <span class="block-label">Estimation mensuelle</span>
          <span class="block-value" :style="{ color: statusColor }">
            {{ formatNumber(projectedMonthly) }}
            <span class="block-unit">/ {{ formatNumber(monthlyQuota) }}</span>
          </span>
          <span class="block-meta">
            {{ projectionLabel }} ({{ projectionTarget }} j)
          </span>
        </div>

        <div class="summary-block">
          <span class="block-label">Statut</span>
          <span class="status-badge" :style="{ color: statusColor, borderColor: statusColor }">
            {{ statusLabel }}
          </span>
          <span class="block-meta">Seuils 80% / 100%</span>
        </div>
      </div>

      <div class="quota-bar">
        <div class="bar">
          <div
            class="bar-fill"
            :style="{
              width: `${usagePercent}%`,
              backgroundColor: statusColor
            }"
          ></div>
          <div class="bar-marker" style="left: 80%" title="Seuil d'alerte 80%"></div>
        </div>
        <div class="bar-legend">
          <span>0</span>
          <span :style="{ color: statusColor }">{{ usagePercent.toFixed(0) }}%</span>
          <span>{{ formatNumber(monthlyQuota) }}</span>
        </div>
      </div>

      <div v-if="breakdown.length > 0" class="breakdown">
        <h4 class="breakdown-title">Répartition par modèle</h4>
        <div class="breakdown-table-wrapper">
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Modèle</th>
                <th class="num">Interactions</th>
                <th class="num">Multiplicateur</th>
                <th class="num">Premium req.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in breakdown"
                :key="row.modelId"
                :class="{ 'row-unknown': row.isUnknown }"
              >
                <td>
                  {{ row.displayName }}
                  <span v-if="row.isUnknown" class="unknown-tag">non mappé</span>
                </td>
                <td class="num">{{ formatNumber(row.interactions) }}</td>
                <td class="num">
                  <span class="multiplier-pill" :data-zero="row.multiplier === 0">
                    {{ formatMultiplier(row.multiplier) }}
                  </span>
                </td>
                <td class="num strong">{{ formatNumber(row.premiumRequests) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="disclaimer">
        ⓘ Estimation basée sur le nombre d'interactions chat/agent ×
        multiplicateur du modèle. Les vraies premium requests sont mesurées par
        l'API de billing GitHub, qui peut différer (outils internes, retries…).
      </p>
    </template>
  </div>
</template>

<style scoped>
.premium-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-tag {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  vertical-align: middle;
}

.period-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.375rem;
}

.period-pill {
  padding: 0.125rem 0.5rem;
  background-color: rgba(31, 111, 235, 0.15);
  color: #58a6ff;
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  font-weight: 600;
}

.period-range {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-family: var(--font-mono);
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-accent-blue);
}

.premium-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 700px) {
  .premium-summary {
    grid-template-columns: 1fr;
  }
}

.summary-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.block-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.block-value {
  font-size: 1.625rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.block-unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.block-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  width: fit-content;
}

.quota-bar .bar {
  position: relative;
  height: 12px;
  background-color: var(--color-bg-tertiary);
  border-radius: 6px;
  overflow: hidden;
}

.quota-bar .bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.quota-bar .bar-marker {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background-color: rgba(255, 255, 255, 0.3);
}

.bar-legend {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.4rem;
  font-family: var(--font-mono);
}

.breakdown-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.breakdown-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.breakdown-table thead th {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  text-align: left;
  font-weight: 600;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
}

.breakdown-table th.num,
.breakdown-table td.num {
  text-align: right;
  font-family: var(--font-mono);
}

.breakdown-table tbody td {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-border-muted);
}

.breakdown-table tbody tr:last-child td {
  border-bottom: none;
}

.breakdown-table tbody tr:hover {
  background-color: var(--color-bg-tertiary);
}

.breakdown-table .strong {
  font-weight: 700;
  color: var(--color-text-primary);
}

.row-unknown td {
  color: var(--color-text-secondary);
  font-style: italic;
}

.unknown-tag {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0 0.375rem;
  border-radius: var(--radius-sm);
  background-color: rgba(210, 153, 34, 0.15);
  color: var(--color-accent-yellow);
  font-size: 0.6875rem;
  font-style: normal;
  font-weight: 600;
}

.multiplier-pill {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background-color: rgba(31, 111, 235, 0.15);
  color: #58a6ff;
  font-weight: 600;
  font-size: 0.8125rem;
}

.multiplier-pill[data-zero='true'] {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.disclaimer {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.5;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-muted);
}
</style>
