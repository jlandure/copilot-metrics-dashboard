<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePremiumRequests } from '@/composables/usePremiumRequests'
import { usePremiumSettings } from '@/composables/usePremiumSettings'

const props = withDefaults(
  defineProps<{
    limit?: number
  }>(),
  { limit: 8 }
)

const emit = defineEmits<{
  (e: 'open-settings'): void
}>()

const router = useRouter()
const {
  usageByUser,
  monthlyQuota,
  projectMonthly,
  totalPremiumRequests,
  periodDays,
  projectionTarget,
  dataRange
} = usePremiumRequests()
const { currentPlan, settings } = usePremiumSettings()

const topConsumers = computed(() => usageByUser.value.slice(0, props.limit))

const projectedTotal = computed(() => projectMonthly(totalPremiumRequests.value))

const totalQuota = computed(() => monthlyQuota.value * usageByUser.value.length)

const totalUsagePercent = computed(() => {
  if (!totalQuota.value) return 0
  return Math.min(100, (projectedTotal.value / totalQuota.value) * 100)
})

const usersOverQuota = computed(() => {
  return usageByUser.value.filter((u) => projectMonthly(u.premium_requests) > monthlyQuota.value)
    .length
})

const usersNearQuota = computed(() => {
  return usageByUser.value.filter((u) => {
    const projected = projectMonthly(u.premium_requests)
    return projected >= monthlyQuota.value * 0.8 && projected <= monthlyQuota.value
  }).length
})

function getInitials(login: string): string {
  return login.slice(0, 2).toUpperCase()
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('fr-FR')
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

function userPercent(premium: number): number {
  if (!monthlyQuota.value) return 0
  return Math.min(100, (projectMonthly(premium) / monthlyQuota.value) * 100)
}

function userColor(premium: number): string {
  const pct = userPercent(premium)
  if (pct >= 100) return 'var(--color-accent-red)'
  if (pct >= 80) return 'var(--color-accent-yellow)'
  return 'var(--color-accent-green)'
}

function navigateTo(login: string) {
  router.push({ name: 'user-detail', params: { userLogin: login } })
}

const versionLabel = computed(() =>
  settings.value.multiplierVersion === 'current'
    ? 'multiplicateurs actuels'
    : 'nouveaux multiplicateurs'
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
  settings.value.periodMode === 'current_month' ? 'fin de mois' : '30 jours'
)

function formatShortDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  if (!y || !m || !d) return day
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <div>
        <h3 class="dashboard-card-title">
          Premium Requests
          <span class="card-tag">estimation</span>
        </h3>
        <p class="dashboard-card-subtitle">
          {{ currentPlan.label }} · {{ formatNumber(monthlyQuota) }} req/mois ·
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

    <div class="kpi-row">
      <div class="kpi">
        <span class="kpi-label">Total période</span>
        <span class="kpi-value">{{ formatNumber(totalPremiumRequests) }}</span>
        <span class="kpi-meta">{{ periodDays }} jours</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Projeté ({{ projectionLabel }})</span>
        <span class="kpi-value blue">{{ formatNumber(projectedTotal) }}</span>
        <span class="kpi-meta">{{ projectionTarget }} jours · tous users</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Au-dessus du quota</span>
        <span class="kpi-value red">{{ usersOverQuota }}</span>
        <span class="kpi-meta">utilisateur(s)</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Proches du quota</span>
        <span class="kpi-value yellow">{{ usersNearQuota }}</span>
        <span class="kpi-meta">≥ 80% du quota</span>
      </div>
    </div>

    <div v-if="totalQuota" class="aggregate-bar">
      <div class="bar">
        <div
          class="bar-fill"
          :style="{
            width: `${totalUsagePercent}%`,
            backgroundColor: totalUsagePercent >= 80 ? 'var(--color-accent-yellow)' : 'var(--color-accent-blue)'
          }"
        ></div>
      </div>
      <div class="bar-legend">
        <span>Conso projetée vs quota total</span>
        <span class="bold">{{ totalUsagePercent.toFixed(0) }}%</span>
      </div>
    </div>

    <h4 class="list-title">Top {{ Math.min(props.limit, topConsumers.length) }} consommateurs</h4>

    <div v-if="topConsumers.length === 0" class="empty-state">
      <p>Aucune donnée d'utilisation premium détectée.</p>
    </div>

    <ul v-else class="consumer-list">
      <li
        v-for="user in topConsumers"
        :key="user.user_login"
        class="consumer-item"
        @click="navigateTo(user.user_login)"
      >
        <div class="consumer-avatar">{{ getInitials(user.user_login) }}</div>
        <div class="consumer-content">
          <div class="consumer-row">
            <span class="consumer-name">{{ user.user_login }}</span>
            <span class="consumer-value" :style="{ color: userColor(user.premium_requests) }">
              {{ formatNumber(user.premium_requests) }}
              <span class="consumer-unit">req</span>
            </span>
          </div>
          <div class="consumer-bar">
            <div
              class="consumer-bar-fill"
              :style="{
                width: `${userPercent(user.premium_requests)}%`,
                backgroundColor: userColor(user.premium_requests)
              }"
            ></div>
          </div>
          <div class="consumer-meta">
            <span>
              Projeté : {{ formatNumber(projectMonthly(user.premium_requests)) }} /
              {{ formatNumber(monthlyQuota) }} req/mois
            </span>
            <span :style="{ color: userColor(user.premium_requests) }" class="bold">
              {{ userPercent(user.premium_requests).toFixed(0) }}%
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
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

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

@media (max-width: 700px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.kpi-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.kpi-value {
  font-size: 1.375rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text-primary);
}

.kpi-value.blue { color: var(--color-accent-blue); }
.kpi-value.red { color: var(--color-accent-red); }
.kpi-value.yellow { color: var(--color-accent-yellow); }

.kpi-meta {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.aggregate-bar {
  margin-bottom: 1rem;
}

.aggregate-bar .bar {
  height: 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.aggregate-bar .bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-legend {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.375rem;
}

.bold {
  font-weight: 600;
  color: var(--color-text-primary);
}

.list-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
}

.consumer-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.consumer-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.625rem 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.consumer-item:hover {
  border-color: var(--color-accent-blue);
  transform: translateX(2px);
}

.consumer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8125rem;
  color: white;
  text-transform: uppercase;
  flex-shrink: 0;
}

.consumer-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.consumer-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.consumer-name {
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.consumer-value {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.9375rem;
}

.consumer-unit {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.consumer-bar {
  height: 5px;
  background-color: var(--color-bg-primary);
  border-radius: 3px;
  overflow: hidden;
}

.consumer-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.consumer-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}
</style>
