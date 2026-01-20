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
import { Bar } from 'vue-chartjs'
import type { LanguageMetrics } from '@/types/copilot'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  languageMetrics: LanguageMetrics[]
  limit?: number
}>()

const chartColors = [
  '#238636',
  '#1f6feb',
  '#a371f7',
  '#d29922',
  '#f85149',
  '#3fb950',
  '#58a6ff',
  '#bc8cff',
  '#e3b341',
  '#ff7b72'
]

const limitedData = computed(() => props.languageMetrics.slice(0, props.limit || 10))

const chartData = computed(() => ({
  labels: limitedData.value.map((l) => l.language),
  datasets: [
    {
      label: 'Code Generated',
      data: limitedData.value.map((l) => l.code_generated),
      backgroundColor: chartColors.slice(0, limitedData.value.length),
      borderRadius: 6,
      barThickness: 24
    }
  ]
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
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
      ticks: { color: '#8b949e' },
      beginAtZero: true
    },
    y: {
      grid: { display: false },
      ticks: { color: '#8b949e' }
    }
  }
}
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
