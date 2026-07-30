<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { Line } from 'vue-chartjs'
import { useAiCreditsEstimate } from '@/composables/useAiCreditsEstimate'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const { dates, buildTrendSeries, hasOfficialCredits } = useAiCreditsEstimate()

type GroupBy = 'model' | 'user'
const groupBy = ref<GroupBy>('user')

// Official credits have no per-model breakdown — keep the chart on users.
watch(
  hasOfficialCredits,
  (official) => {
    if (official) groupBy.value = 'user'
  },
  { immediate: true }
)

/**
 * GitHub-like categorical palette. The "All other" series is always rendered
 * with a muted grey + dashed style, like the native AI-usage chart.
 */
const PALETTE = [
  '#1f6feb',
  '#238636',
  '#db6d28',
  '#bf3989',
  '#d29922',
  '#a371f7',
  '#3fb950',
  '#f85149'
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

const trend = computed(() => buildTrendSeries(groupBy.value, 5))

const chartData = computed(() => ({
  labels: trend.value.labels.map(formatDate),
  datasets: trend.value.series.map((s, i) => {
    const isOther = s.key === '__other__'
    return {
      label: isOther ? 'All other' : s.label,
      data: s.data,
      borderColor: isOther ? '#8b949e' : PALETTE[i % PALETTE.length],
      backgroundColor: 'transparent',
      borderDash: isOther ? [4, 4] : [],
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5
    }
  })
}))

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'start' as const,
      labels: {
        color: '#8b949e',
        font: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
        usePointStyle: true,
        boxWidth: 8,
        padding: 16
      }
    },
    tooltip: {
      backgroundColor: '#161b22',
      borderColor: '#30363d',
      borderWidth: 1,
      titleColor: '#e6edf3',
      bodyColor: '#8b949e',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: TooltipItem<'line'>) =>
          `${ctx.dataset.label ?? ''}: ${usd.format(ctx.parsed.y ?? 0)}`
      }
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(48, 54, 61, 0.5)' },
      ticks: { color: '#8b949e' }
    },
    y: {
      grid: { color: 'rgba(48, 54, 61, 0.5)' },
      ticks: {
        color: '#8b949e',
        callback: (value: string | number) => usd.format(Number(value))
      },
      beginAtZero: true
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
}))

const periodLabel = computed(() => {
  const d = dates.value
  if (d.length === 0) return ''
  const start = new Date(d[0]!)
  const end = new Date(d[d.length - 1]!)
  const startLabel = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  return `${startLabel} – ${endLabel}`
})

const hasData = computed(() => trend.value.series.length > 0 && dates.value.length > 0)
</script>

<template>
  <div class="dashboard-card chart-card">
    <div class="dashboard-card-header">
      <div>
        <h3 class="dashboard-card-title">
          Usage grouped by {{ groupBy === 'model' ? 'models' : 'users' }}
        </h3>
        <p class="dashboard-card-subtitle">
          {{ periodLabel }}
          <template v-if="hasOfficialCredits"> · Official AI credits</template>
          <template v-else-if="groupBy === 'model'"> · Estimated from interactions</template>
        </p>
      </div>
      <div class="chart-controls">
        <div v-if="!hasOfficialCredits" class="group-toggle">
          <span class="toggle-label">Group by</span>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: groupBy === 'model' }"
            @click="groupBy = 'model'"
          >
            Models
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: groupBy === 'user' }"
            @click="groupBy = 'user'"
          >
            Users
          </button>
        </div>
        <span class="granularity">Granularity: Daily</span>
      </div>
    </div>

    <div class="chart-container">
      <Line v-if="hasData" :data="chartData" :options="chartOptions" />
      <div v-else class="empty">No usage data for this period.</div>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  padding: 1.25rem 1.5rem;
}

.dashboard-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.group-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.375rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.toggle-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  padding-left: 0.25rem;
}

.toggle-btn {
  padding: 0.25rem 0.625rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn.active {
  background-color: var(--color-accent-blue);
  color: white;
}

.toggle-btn:not(.active):hover {
  color: var(--color-text-primary);
}

.granularity {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.chart-container {
  position: relative;
  height: 360px;
  width: 100%;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
