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
import type { TooltipItem } from 'chart.js'
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
}>()

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
}

const numFmt = new Intl.NumberFormat('en-US')

const chartData = computed(() => ({
  labels: props.dailyMetrics.map((d) => formatDate(d.day)),
  datasets: [
    {
      label: 'LOC Suggested',
      data: props.dailyMetrics.map((d) => d.loc_suggested ?? 0),
      borderColor: '#d29922',
      backgroundColor: 'rgba(210, 153, 34, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
      yAxisID: 'y'
    },
    {
      label: 'LOC Added',
      data: props.dailyMetrics.map((d) => d.loc_added ?? 0),
      borderColor: '#238636',
      backgroundColor: 'rgba(35, 134, 54, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
      yAxisID: 'y'
    },
    {
      label: 'Acceptance %',
      data: props.dailyMetrics.map((d) => {
        const suggested = d.loc_suggested ?? 0
        if (suggested <= 0) return 0
        return Math.round(((d.loc_added ?? 0) / suggested) * 100)
      }),
      borderColor: '#58a6ff',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderDash: [4, 4],
      yAxisID: 'y1'
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#8b949e',
        font: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
        usePointStyle: true,
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
        label: (ctx: TooltipItem<'line'>) => {
          const value = ctx.parsed.y ?? 0
          if (ctx.dataset.label === 'Acceptance %') {
            return `Acceptance: ${value}%`
          }
          return `${ctx.dataset.label}: ${numFmt.format(value)}`
        }
      }
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
      title: { display: true, text: 'Lines of code', color: '#8b949e' }
    },
    y1: {
      type: 'linear' as const,
      position: 'right' as const,
      grid: { drawOnChartArea: false },
      ticks: {
        color: '#8b949e',
        callback: (value: string | number) => `${value}%`
      },
      min: 0,
      max: 100,
      title: { display: true, text: 'Acceptance %', color: '#8b949e' }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
}))
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
