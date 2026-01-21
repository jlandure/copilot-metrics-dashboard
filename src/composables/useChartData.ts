import { computed, type ComputedRef } from 'vue'
import type { ChartData, ChartOptions } from 'chart.js'
import type {
  DailyMetrics,
  FeatureMetrics,
  IdeMetrics,
  LanguageMetrics
} from '@/types/copilot'

// GitHub-inspired color palette
const colors = {
  primary: '#238636',
  secondary: '#1f6feb',
  accent: '#a371f7',
  warning: '#d29922',
  danger: '#f85149',
  muted: '#8b949e',
  background: '#0d1117',
  surface: '#161b22',
  border: '#30363d'
}

const chartColors = [
  '#238636', // Green
  '#1f6feb', // Blue
  '#a371f7', // Purple
  '#d29922', // Yellow
  '#f85149', // Red
  '#3fb950', // Light Green
  '#58a6ff', // Light Blue
  '#bc8cff', // Light Purple
  '#e3b341', // Light Yellow
  '#ff7b72' // Light Red
]

export function useChartData() {
  // Line chart for daily active users
  const createDailyUsersChart = (
    dailyMetrics: ComputedRef<DailyMetrics[]>
  ): ComputedRef<ChartData<'line'>> => {
    return computed(() => ({
      labels: dailyMetrics.value.map((d) => formatDate(d.day)),
      datasets: [
        {
          label: 'Active Users',
          data: dailyMetrics.value.map((d) => d.active_users),
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}33`,
          fill: true,
          tension: 0.4
        }
      ]
    }))
  }

  // Line chart for daily interactions
  const createDailyInteractionsChart = (
    dailyMetrics: ComputedRef<DailyMetrics[]>
  ): ComputedRef<ChartData<'line'>> => {
    return computed(() => ({
      labels: dailyMetrics.value.map((d) => formatDate(d.day)),
      datasets: [
        {
          label: 'Interactions',
          data: dailyMetrics.value.map((d) => d.total_interactions),
          borderColor: colors.secondary,
          backgroundColor: `${colors.secondary}33`,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Code Generated',
          data: dailyMetrics.value.map((d) => d.total_code_generated),
          borderColor: colors.accent,
          backgroundColor: `${colors.accent}33`,
          fill: true,
          tension: 0.4
        }
      ]
    }))
  }

  // Doughnut chart for feature distribution
  const createFeatureChart = (
    featureMetrics: ComputedRef<FeatureMetrics[]>
  ): ComputedRef<ChartData<'doughnut'>> => {
    return computed(() => ({
      labels: featureMetrics.value.map((f) => f.feature),
      datasets: [
        {
          data: featureMetrics.value.map((f) => f.code_generated),
          backgroundColor: chartColors.slice(0, featureMetrics.value.length),
          borderColor: colors.surface,
          borderWidth: 2
        }
      ]
    }))
  }

  // Bar chart for IDE usage
  const createIdeChart = (
    ideMetrics: ComputedRef<IdeMetrics[]>
  ): ComputedRef<ChartData<'bar'>> => {
    return computed(() => ({
      labels: ideMetrics.value.map((i) => i.ide),
      datasets: [
        {
          label: 'Users',
          data: ideMetrics.value.map((i) => i.users),
          backgroundColor: colors.primary,
          borderRadius: 6
        },
        {
          label: 'Code Generated',
          data: ideMetrics.value.map((i) => Math.round(i.code_generated / 100)),
          backgroundColor: colors.secondary,
          borderRadius: 6
        }
      ]
    }))
  }

  // Horizontal bar chart for language usage
  const createLanguageChart = (
    languageMetrics: ComputedRef<LanguageMetrics[]>,
    limit = 10
  ): ComputedRef<ChartData<'bar'>> => {
    return computed(() => {
      const topLanguages = languageMetrics.value.slice(0, limit)
      return {
        labels: topLanguages.map((l) => l.language),
        datasets: [
          {
            label: 'Code Generated',
            data: topLanguages.map((l) => l.code_generated),
            backgroundColor: chartColors.slice(0, topLanguages.length),
            borderRadius: 6
          }
        ]
      }
    })
  }

  // Chart options
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.muted,
          font: { family: "'Segoe UI', system-ui, sans-serif" }
        }
      }
    },
    scales: {
      x: {
        grid: { color: colors.border },
        ticks: { color: colors.muted }
      },
      y: {
        grid: { color: colors.border },
        ticks: { color: colors.muted },
        beginAtZero: true
      }
    }
  }

  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: colors.muted,
          font: { family: "'Segoe UI', system-ui, sans-serif" },
          padding: 16
        }
      }
    }
  }

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.muted,
          font: { family: "'Segoe UI', system-ui, sans-serif" }
        }
      }
    },
    scales: {
      x: {
        grid: { color: colors.border },
        ticks: { color: colors.muted }
      },
      y: {
        grid: { color: colors.border },
        ticks: { color: colors.muted },
        beginAtZero: true
      }
    }
  }

  const horizontalBarChartOptions: ChartOptions<'bar'> = {
    ...barChartOptions,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    }
  }

  return {
    colors,
    chartColors,
    createDailyUsersChart,
    createDailyInteractionsChart,
    createFeatureChart,
    createIdeChart,
    createLanguageChart,
    lineChartOptions,
    doughnutChartOptions,
    barChartOptions,
    horizontalBarChartOptions
  }
}

// Helper function
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
