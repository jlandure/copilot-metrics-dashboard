<script setup lang="ts">
import type { GlobalStats } from '@/types/copilot'

defineProps<{
  stats: GlobalStats
  loading?: boolean
}>()

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toLocaleString('en-US')
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="stats-section">
    <div class="stats-header">
      <div class="date-range-badge" v-if="stats.report_start_day">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h-2a.25.25 0 00-.25.25V6h11V3.75a.25.25 0 00-.25-.25h-8.5z"
          />
        </svg>
        {{ formatDate(stats.report_start_day) }} - {{ formatDate(stats.report_end_day) }}
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-card-label">Active Users</span>
        <span class="stat-card-value blue">
          <template v-if="!loading">{{ formatNumber(stats.total_users) }}</template>
          <Skeleton v-else width="80px" height="2.5rem" />
        </span>
        <span class="stat-card-trend">During report period</span>
      </div>

      <div class="stat-card">
        <span class="stat-card-label">Total Interactions</span>
        <span class="stat-card-value purple">
          <template v-if="!loading">{{ formatNumber(stats.total_interactions) }}</template>
          <Skeleton v-else width="80px" height="2.5rem" />
        </span>
        <span class="stat-card-trend">Chat + Completions</span>
      </div>

      <div class="stat-card">
        <span class="stat-card-label">Suggestions Generated</span>
        <span class="stat-card-value">
          <template v-if="!loading">{{ formatNumber(stats.total_code_generated) }}</template>
          <Skeleton v-else width="80px" height="2.5rem" />
        </span>
        <span class="stat-card-trend">Code proposed by Copilot</span>
      </div>

      <div class="stat-card">
        <span class="stat-card-label">Suggestions Accepted</span>
        <span class="stat-card-value green">
          <template v-if="!loading">{{ formatNumber(stats.total_code_accepted) }}</template>
          <Skeleton v-else width="80px" height="2.5rem" />
        </span>
        <span class="stat-card-trend">Code accepted by devs</span>
      </div>

      <div class="stat-card">
        <span class="stat-card-label">Acceptance Rate</span>
        <span class="stat-card-value green">
          <template v-if="!loading">{{ stats.average_acceptance_rate }}%</template>
          <Skeleton v-else width="60px" height="2.5rem" />
        </span>
        <span class="stat-card-trend">Global average</span>
      </div>

      <div class="stat-card">
        <span class="stat-card-label">Lines of Code Added</span>
        <span class="stat-card-value yellow">
          <template v-if="!loading">{{ formatNumber(stats.total_loc_added) }}</template>
          <Skeleton v-else width="80px" height="2.5rem" />
        </span>
        <span class="stat-card-trend">Via Copilot</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-section {
  margin-bottom: 1.5rem;
}

.stats-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
</style>
