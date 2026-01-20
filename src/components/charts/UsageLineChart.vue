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

const props = defineProps<{
  dailyMetrics: DailyMetrics[]
  showInteractions?: boolean
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
}

const chartData = computed(() => {
  if (props.showInteractions) {
    return {
      labels: props.dailyMetrics.map((d) => formatDate(d.day)),
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

  return {
    labels: props.dailyMetrics.map((d) => formatDate(d.day)),
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

const chartOptions = {
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
      grid: { color: 'rgba(48, 54, 61, 0.5)' },
      ticks: { color: '#8b949e' },
      beginAtZero: true
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
}
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
