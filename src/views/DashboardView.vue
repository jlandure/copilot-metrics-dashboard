<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCopilotMetrics } from '@/composables/useCopilotMetrics'
import FileUpload from '@/components/FileUpload.vue'
import StatsCards from '@/components/StatsCards.vue'
import UsersTable from '@/components/UsersTable.vue'
import UsageLineChart from '@/components/charts/UsageLineChart.vue'
import FeatureDoughnutChart from '@/components/charts/FeatureDoughnutChart.vue'
import IdeBarChart from '@/components/charts/IdeBarChart.vue'
import LanguageBarChart from '@/components/charts/LanguageBarChart.vue'
import PremiumTopConsumersCard from '@/components/PremiumTopConsumersCard.vue'
import PremiumSettingsDialog from '@/components/PremiumSettingsDialog.vue'
import PremiumDistributionChart from '@/components/charts/PremiumDistributionChart.vue'
import { usePremiumRequests } from '@/composables/usePremiumRequests'
import type { PremiumTierId } from '@/types/premium'

const {
  loading,
  error,
  isDataLoaded,
  loadMetricsFromText,
  clearMetrics,
  usersSummary,
  dailyMetrics,
  featureMetrics,
  ideMetrics,
  languageMetrics,
  globalStats
} = useCopilotMetrics()

const { usersByTier } = usePremiumRequests()

const settingsOpen = ref(false)
const selectedTierId = ref<PremiumTierId | null>(null)

const selectedTier = computed(() =>
  selectedTierId.value
    ? usersByTier.value.find((t) => t.id === selectedTierId.value) ?? null
    : null
)

const filteredUsers = computed(() => {
  if (!selectedTier.value) return usersSummary.value
  const allowed = new Set(selectedTier.value.users.map((u) => u.user_login))
  return usersSummary.value.filter((u) => allowed.has(u.user_login))
})

function clearTierFilter() {
  selectedTierId.value = null
}

watch(
  () => usersByTier.value,
  (tiers) => {
    if (!selectedTierId.value) return
    const found = tiers.find((t) => t.id === selectedTierId.value)
    if (!found || found.count === 0) {
      selectedTierId.value = null
    }
  }
)

function handleFileUpload(data: string) {
  loadMetricsFromText(data)
}
</script>

<template>
  <div class="dashboard">
    <!-- File Upload Screen -->
    <FileUpload v-if="!isDataLoaded" @upload="handleFileUpload" />

    <!-- Dashboard Content -->
    <template v-else>
      <div class="page-header">
        <div>
          <h1 class="page-title">
            Copilot Dashboard
            <span class="page-subtitle">Adoption and usage analytics</span>
          </h1>
        </div>
        <button class="change-data-btn" @click="clearMetrics">
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm9.78-2.22l-5.5 5.5a.749.749 0 01-1.275-.326.749.749 0 01.215-.734l5.5-5.5a.751.751 0 011.042.018.751.751 0 01.018 1.042z"/>
          </svg>
          Change file
        </button>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-banner">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm-.75-2.25a.75.75 0 101.5 0 .75.75 0 00-1.5 0zM8 4a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 008 4z"
          />
        </svg>
        <span>Error loading data: {{ error }}</span>
      </div>

      <!-- Stats Cards -->
      <StatsCards :stats="globalStats" :loading="loading" />

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Daily Active Users -->
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <div>
              <h3 class="dashboard-card-title">Daily Active Users</h3>
              <p class="dashboard-card-subtitle">Trend over the period</p>
            </div>
          </div>
          <div class="chart-container">
            <UsageLineChart
              v-if="dailyMetrics.length > 0"
              :daily-metrics="dailyMetrics"
            />
            <div v-else-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>

        <!-- Daily Interactions -->
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <div>
              <h3 class="dashboard-card-title">Daily Activity</h3>
              <p class="dashboard-card-subtitle">Interactions and generated code</p>
            </div>
          </div>
          <div class="chart-container">
            <UsageLineChart
              v-if="dailyMetrics.length > 0"
              :daily-metrics="dailyMetrics"
              :show-interactions="true"
            />
            <div v-else-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>

        <!-- Feature Distribution -->
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <div>
              <h3 class="dashboard-card-title">Feature Distribution</h3>
              <p class="dashboard-card-subtitle">Chat, Agent, Completions</p>
            </div>
          </div>
          <div class="chart-container">
            <FeatureDoughnutChart
              v-if="featureMetrics.length > 0"
              :feature-metrics="featureMetrics"
            />
            <div v-else-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>

        <!-- IDE Usage -->
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <div>
              <h3 class="dashboard-card-title">IDE Usage</h3>
              <p class="dashboard-card-subtitle">VS Code, IntelliJ, etc.</p>
            </div>
          </div>
          <div class="chart-container">
            <IdeBarChart v-if="ideMetrics.length > 0" :ide-metrics="ideMetrics" />
            <div v-else-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Premium Requests Overview -->
      <div class="premium-grid">
        <PremiumTopConsumersCard :limit="8" @open-settings="settingsOpen = true" />

        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <div>
              <h3 class="dashboard-card-title">Distribution par palier</h3>
              <p class="dashboard-card-subtitle">% du quota mensuel projeté</p>
            </div>
          </div>
          <PremiumDistributionChart
            v-model:selected-tier-id="selectedTierId"
            :tiers="usersByTier"
          />
        </div>
      </div>

      <!-- Language Usage (Full Width) -->
      <div class="dashboard-card" style="margin-bottom: 1.5rem">
        <div class="dashboard-card-header">
          <div>
            <h3 class="dashboard-card-title">Most Used Languages</h3>
            <p class="dashboard-card-subtitle">Top 10 languages by generated code</p>
          </div>
        </div>
        <div class="chart-container" style="height: 350px">
          <LanguageBarChart
            v-if="languageMetrics.length > 0"
            :language-metrics="languageMetrics"
            :limit="10"
          />
          <div v-else-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>

      <!-- Active filter chip -->
      <div v-if="selectedTier" class="active-filter-chip">
        <span
          class="chip-dot"
          :style="{ backgroundColor: selectedTier.color }"
          aria-hidden="true"
        ></span>
        <span class="chip-text">
          Filtre actif :
          <strong>{{ selectedTier.label }}</strong>
        </span>
        <span class="chip-count">{{ filteredUsers.length }} utilisateur(s)</span>
        <button
          type="button"
          class="chip-clear"
          title="Retirer le filtre"
          aria-label="Retirer le filtre"
          @click="clearTierFilter"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
            <path
              d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"
            />
          </svg>
        </button>
      </div>

      <!-- Users Table -->
      <UsersTable
        :users="filteredUsers"
        :loading="loading"
        @open-premium-settings="settingsOpen = true"
      />
    </template>

    <PremiumSettingsDialog v-model:visible="settingsOpen" />
  </div>
</template>

<style scoped>
.dashboard {
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.change-data-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.change-data-btn:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-accent-blue);
}

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

.premium-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1024px) {
  .premium-grid {
    grid-template-columns: 1fr;
  }
}

.active-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem 0.5rem 0.875rem;
  margin-bottom: 0.875rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  animation: chipIn 0.2s ease-out;
}

@keyframes chipIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.chip-text strong {
  font-weight: 600;
  margin-left: 0.25rem;
}

.chip-count {
  padding: 0.125rem 0.5rem;
  background-color: var(--color-bg-tertiary);
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.chip-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  margin-left: 0.125rem;
  background-color: var(--color-bg-tertiary);
  border: none;
  border-radius: 50%;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-clear:hover {
  background-color: var(--color-accent-red);
  color: white;
}
</style>
