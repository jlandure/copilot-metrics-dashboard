<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { DailyMetrics } from '@/types/copilot'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = withDefaults(
  defineProps<{
    dailyMetrics: DailyMetrics[]
    /** users | interactions | credits | loc */
    mode?: 'users' | 'interactions' | 'credits' | 'loc'
    /** @deprecated use mode="interactions" */
    showInteractions?: boolean
  }>(),
  {
    mode: undefined,
    showInteractions: false
  }
)

const resolvedMode = computed(() => {
  if (props.mode) return props.mode
  return props.showInteractions ? 'interactions' : 'users'
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
}

const chartData = computed(() => {
  const labels = props.dailyMetrics.map((d) => formatDate(d.day))

  if (resolvedMode.value === 'interactions') {
    return {
      labels,
      datasets: [
        {
          label: 'Interactions',
          data: props.dailyMetrics.map((d) => d.total_interactions),
          borderColor: '#1f6feb',
          backgroundColor: 'rgba(31, 111, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Code Generated',
          data: props.dailyMetrics.map((d) => d.total_code_generated),
          borderColor: '#a371f7',
          backgroundColor: 'rgba(163, 113, 247, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    }
  }

  if (resolvedMode.value === 'credits') {
    return {
      labels,
      datasets: [
        {
          label: 'AI Credits',
          data: props.dailyMetrics.map((d) => d.ai_credits ?? 0),
          borderColor: '#a371f7',
          backgroundColor: 'rgba(163, 113, 247, 0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Interactions',
          data: props.dailyMetrics.map((d) => d.total_interactions),
          borderColor: '#1f6feb',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          yAxisID: 'y1',
          borderDash: [4, 4]
        }
      ]
    }
  }

  if (resolvedMode.value === 'loc') {
    return {
      labels,
      datasets: [
        {
          label: 'LOC Suggested',
          data: props.dailyMetrics.map((d) => d.loc_suggested ?? 0),
          borderColor: '#d29922',
          backgroundColor: 'rgba(210, 153, 34, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'LOC Added',
          data: props.dailyMetrics.map((d) => d.loc_added ?? 0),
          borderColor: '#238636',
          backgroundColor: 'rgba(35, 134, 54, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    }
  }

  return {
    labels,
    datasets: [
      {
        label: 'Active Users',
        data: props.dailyMetrics.map((d) => d.active_users),
        borderColor: '#238636',
        backgroundColor: 'rgba(35, 134, 54, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6
      }
    ]
  }
})

const chartOptions = computed(() => {
  const dualAxis = resolvedMode.value === 'credits'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#8b949e',
          font: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#161b22',
        borderColor: '#30363d',
        borderWidth: 1,
        titleColor: '#e6edf3',
        bodyColor: '#8b949e',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(48, 54, 61, 0.5)' },
        ticks: { color: '#8b949e' }
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        grid: { color: 'rgba(48, 54, 61, 0.5)' },
        ticks: { color: '#8b949e' },
        beginAtZero: true,
        title: dualAxis
          ? { display: true, text: 'AI Credits', color: '#8b949e' }
          : undefined
      },
      ...(dualAxis
        ? {
            y1: {
              type: 'linear' as const,
              position: 'right' as const,
              grid: { drawOnChartArea: false },
              ticks: { color: '#8b949e' },
              beginAtZero: true,
              title: { display: true, text: 'Interactions', color: '#8b949e' }
            }
          }
        : {})
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }
})
</script>

<template>
  <div class="chart-wrapper">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>
