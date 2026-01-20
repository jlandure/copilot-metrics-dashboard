<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCopilotMetrics } from '@/composables/useCopilotMetrics'
import UsageLineChart from '@/components/charts/UsageLineChart.vue'
import LanguageBarChart from '@/components/charts/LanguageBarChart.vue'
import type { DailyMetrics, LanguageMetrics } from '@/types/copilot'

const route = useRoute()
const router = useRouter()
const { loading, isDataLoaded, getUserMetrics, usersSummary } = useCopilotMetrics()

const userLogin = computed(() => route.params.userLogin as string)
const userMetrics = getUserMetrics(userLogin.value)

// Redirect to dashboard if no data is loaded
watch(
  isDataLoaded,
  (loaded) => {
    if (!loaded) {
      router.push('/')
    }
  },
  { immediate: true }
)

// User summary from aggregated data
const userSummary = computed(() => {
  return usersSummary.value.find((u) => u.user_login === userLogin.value)
})

// Transform user metrics to daily format
const userDailyMetrics = computed<DailyMetrics[]>(() => {
  const dayMap = new Map<
    string,
    { interactions: number; generated: number; accepted: number }
  >()

  for (const metric of userMetrics.value) {
    const existing = dayMap.get(metric.day)
    if (existing) {
      existing.interactions += metric.user_initiated_interaction_count
      existing.generated += metric.code_generation_activity_count
      existing.accepted += metric.code_acceptance_activity_count
    } else {
      dayMap.set(metric.day, {
        interactions: metric.user_initiated_interaction_count,
        generated: metric.code_generation_activity_count,
        accepted: metric.code_acceptance_activity_count
      })
    }
  }

  return Array.from(dayMap.entries())
    .map(([day, data]) => ({
      day,
      active_users: 1,
      total_interactions: data.interactions,
      total_code_generated: data.generated,
      total_code_accepted: data.accepted,
      acceptance_rate: data.generated > 0 ? Math.round((data.accepted / data.generated) * 100) : 0
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
})

// User language metrics
const userLanguageMetrics = computed<LanguageMetrics[]>(() => {
  const langMap = new Map<string, { generated: number; accepted: number }>()

  for (const metric of userMetrics.value) {
    for (const lang of metric.totals_by_language_feature) {
      const existing = langMap.get(lang.language)
      if (existing) {
        existing.generated += lang.code_generation_activity_count
        existing.accepted += lang.code_acceptance_activity_count
      } else {
        langMap.set(lang.language, {
          generated: lang.code_generation_activity_count,
          accepted: lang.code_acceptance_activity_count
        })
      }
    }
  }

  return Array.from(langMap.entries())
    .map(([language, data]) => ({
      language: language.charAt(0).toUpperCase() + language.slice(1),
      code_generated: data.generated,
      code_accepted: data.accepted,
      acceptance_rate: data.generated > 0 ? Math.round((data.accepted / data.generated) * 100) : 0
    }))
    .sort((a, b) => b.code_generated - a.code_generated)
})

// Feature breakdown for this user
const userFeatureBreakdown = computed(() => {
  const featureMap = new Map<
    string,
    { interactions: number; generated: number; accepted: number }
  >()

  for (const metric of userMetrics.value) {
    for (const feature of metric.totals_by_feature) {
      const existing = featureMap.get(feature.feature)
      if (existing) {
        existing.interactions += feature.user_initiated_interaction_count
        existing.generated += feature.code_generation_activity_count
        existing.accepted += feature.code_acceptance_activity_count
      } else {
        featureMap.set(feature.feature, {
          interactions: feature.user_initiated_interaction_count,
          generated: feature.code_generation_activity_count,
          accepted: feature.code_acceptance_activity_count
        })
      }
    }
  }

  return Array.from(featureMap.entries())
    .map(([feature, data]) => ({
      feature: formatFeatureName(feature),
      interactions: data.interactions,
      generated: data.generated,
      accepted: data.accepted,
      rate: data.generated > 0 ? Math.round((data.accepted / data.generated) * 100) : 0
    }))
    .sort((a, b) => b.generated - a.generated)
})

function formatFeatureName(feature: string): string {
  const names: Record<string, string> = {
    chat_panel_ask_mode: 'Chat - Ask Mode',
    chat_panel_agent_mode: 'Chat - Agent Mode',
    chat_panel_edit_mode: 'Chat - Edit Mode',
    code_completion: 'Code Completion',
    inline_chat: 'Inline Chat'
  }
  return names[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function getInitials(login: string): string {
  return login.slice(0, 2).toUpperCase()
}

function getAcceptanceRateColor(rate: number): string {
  if (rate >= 30) return 'var(--color-accent-green)'
  if (rate >= 15) return 'var(--color-accent-yellow)'
  return 'var(--color-accent-red)'
}

</script>

<template>
  <div class="user-detail">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <a href="#" @click.prevent="router.push('/')">Dashboard</a>
      <span class="breadcrumb-separator">/</span>
      <span>{{ userLogin }}</span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading data...</p>
    </div>

    <!-- User Not Found -->
    <div v-else-if="!userSummary" class="empty-state">
      <div class="empty-state-icon">👤</div>
      <p>User not found</p>
      <Button label="Back to Dashboard" @click="router.push('/')" />
    </div>

    <!-- User Content -->
    <template v-else>
      <!-- User Header -->
      <div class="user-header">
        <div class="user-avatar-large">{{ getInitials(userLogin) }}</div>
        <div class="user-info">
          <h1 class="user-name">{{ userLogin }}</h1>
          <p class="user-meta">
            <Tag :value="userSummary.primary_ide" severity="info" />
            <span>{{ userSummary.active_days }} active days</span>
            <span>Last activity: {{ userSummary.last_active_day }}</span>
          </p>
        </div>
      </div>

      <!-- User Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card-label">Interactions</span>
          <span class="stat-card-value purple">
            {{ formatNumber(userSummary.total_interactions) }}
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Code Generated</span>
          <span class="stat-card-value">
            {{ formatNumber(userSummary.total_code_generated) }}
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Code Accepted</span>
          <span class="stat-card-value green">
            {{ formatNumber(userSummary.total_code_accepted) }}
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Acceptance Rate</span>
          <span
            class="stat-card-value"
            :style="{ color: getAcceptanceRateColor(userSummary.acceptance_rate) }"
          >
            {{ userSummary.acceptance_rate }}%
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Lines Added</span>
          <span class="stat-card-value yellow">
            {{ formatNumber(userSummary.loc_added) }}
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Lines Suggested</span>
          <span class="stat-card-value">
            {{ formatNumber(userSummary.loc_suggested) }}
          </span>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <!-- Daily Activity -->
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <h3 class="dashboard-card-title">Daily Activity</h3>
          </div>
          <div class="chart-container">
            <UsageLineChart
              v-if="userDailyMetrics.length > 0"
              :daily-metrics="userDailyMetrics"
              :show-interactions="true"
            />
            <div v-else class="empty-state">
              <p>No data available</p>
            </div>
          </div>
        </div>

        <!-- Languages -->
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <h3 class="dashboard-card-title">Languages Used</h3>
          </div>
          <div class="chart-container">
            <LanguageBarChart
              v-if="userLanguageMetrics.length > 0"
              :language-metrics="userLanguageMetrics"
              :limit="8"
            />
            <div v-else class="empty-state">
              <p>No data available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Breakdown Table -->
      <div class="dashboard-card">
        <div class="dashboard-card-header">
          <h3 class="dashboard-card-title">Feature Breakdown</h3>
        </div>
        <DataTable :value="userFeatureBreakdown">
          <Column field="feature" header="Feature" sortable />
          <Column field="interactions" header="Interactions" sortable>
            <template #body="{ data }">
              {{ formatNumber(data.interactions) }}
            </template>
          </Column>
          <Column field="generated" header="Code Generated" sortable>
            <template #body="{ data }">
              {{ formatNumber(data.generated) }}
            </template>
          </Column>
          <Column field="accepted" header="Code Accepted" sortable>
            <template #body="{ data }">
              <span style="color: var(--color-accent-green)">
                {{ formatNumber(data.accepted) }}
              </span>
            </template>
          </Column>
          <Column field="rate" header="Rate" sortable>
            <template #body="{ data }">
              <div class="acceptance-rate-bar">
                <div class="bar">
                  <div
                    class="bar-fill"
                    :style="{
                      width: `${Math.min(data.rate, 100)}%`,
                      backgroundColor: getAcceptanceRateColor(data.rate)
                    }"
                  ></div>
                </div>
                <span class="rate-value" :style="{ color: getAcceptanceRateColor(data.rate) }">
                  {{ data.rate }}%
                </span>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </div>
</template>

<style scoped>
.user-detail {
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

.user-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.75rem;
  color: white;
  text-transform: uppercase;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.user-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
