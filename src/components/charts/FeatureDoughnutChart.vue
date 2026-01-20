<script setup lang="ts">
import { computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import type { FeatureMetrics } from '@/types/copilot'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  featureMetrics: FeatureMetrics[]
}>()

const chartColors = [
  '#238636', // Green
  '#1f6feb', // Blue
  '#a371f7', // Purple
  '#d29922', // Yellow
  '#f85149' // Red
]

const chartData = computed(() => ({
  labels: props.featureMetrics.map((f) => f.feature),
  datasets: [
    {
      data: props.featureMetrics.map((f) => f.code_generated),
      backgroundColor: chartColors.slice(0, props.featureMetrics.length),
      borderColor: '#161b22',
      borderWidth: 3,
      hoverOffset: 8
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#8b949e',
        font: {
          family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          size: 12
        },
        usePointStyle: true,
        pointStyle: 'circle' as const,
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
      cornerRadius: 8
    }
  }
}
</script>

<template>
  <div class="chart-wrapper">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>
