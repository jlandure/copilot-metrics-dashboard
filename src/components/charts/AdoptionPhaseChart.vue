<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { AdoptionPhaseMetrics } from '@/types/copilot'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  adoptionMetrics: AdoptionPhaseMetrics[]
}>()

const PHASE_COLORS: Record<string, string> = {
  'Phase 1': '#1f6feb',
  'Phase 2': '#a371f7',
  'Phase 3': '#238636',
  'No Cohort': '#8b949e',
  Unknown: '#484f58'
}

const creditsFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

const chartData = computed(() => {
  const labels = props.adoptionMetrics.map((m) => m.phase)
  const colors = labels.map((p) => PHASE_COLORS[p] ?? '#58a6ff')

  return {
    labels,
    datasets: [
      {
        label: 'Users',
        data: props.adoptionMetrics.map((m) => m.users),
        backgroundColor: colors.map((c) => c + 'cc'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y'
      },
      {
        label: 'AI Credits',
        data: props.adoptionMetrics.map((m) => Math.round(m.ai_credits)),
        backgroundColor: colors.map((c) => c + '55'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y1'
      }
    ]
  }
})

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
        label: (ctx: TooltipItem<'bar'>) => {
          const value = ctx.parsed.y ?? 0
          if (ctx.dataset.label === 'AI Credits') {
            return `AI Credits: ${creditsFmt.format(value)}`
          }
          return `Users: ${value}`
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
      title: { display: true, text: 'Users', color: '#8b949e' }
    },
    y1: {
      type: 'linear' as const,
      position: 'right' as const,
      grid: { drawOnChartArea: false },
      ticks: {
        color: '#8b949e',
        callback: (value: string | number) => creditsFmt.format(Number(value))
      },
      beginAtZero: true,
      title: { display: true, text: 'AI Credits', color: '#8b949e' }
    }
  }
}))
</script>

<template>
  <div class="chart-wrapper">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>
