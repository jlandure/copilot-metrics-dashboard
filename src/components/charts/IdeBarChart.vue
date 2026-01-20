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
import type { IdeMetrics } from '@/types/copilot'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  ideMetrics: IdeMetrics[]
}>()

const chartData = computed(() => ({
  labels: props.ideMetrics.map((i) => i.ide),
  datasets: [
    {
      label: 'Users',
      data: props.ideMetrics.map((i) => i.users),
      backgroundColor: '#238636',
      borderRadius: 6,
      barThickness: 32
    },
    {
      label: 'Code Generated (×100)',
      data: props.ideMetrics.map((i) => Math.round(i.code_generated / 100)),
      backgroundColor: '#1f6feb',
      borderRadius: 6,
      barThickness: 32
    }
  ]
}))

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
      grid: { display: false },
      ticks: { color: '#8b949e' }
    },
    y: {
      grid: { color: 'rgba(48, 54, 61, 0.5)' },
      ticks: { color: '#8b949e' },
      beginAtZero: true
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
