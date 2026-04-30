<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ActiveElement,
  type ChartEvent,
  type TooltipItem
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import type { PremiumTier, PremiumTierId } from '@/types/premium'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  tiers: PremiumTier[]
  selectedTierId?: PremiumTierId | null
}>()

const emit = defineEmits<{
  (e: 'update:selectedTierId', value: PremiumTierId | null): void
}>()

const TOOLTIP_MAX_USERS = 5

/** Resolve CSS custom properties to a usable color string for chart.js. */
function resolveColor(token: string): string {
  if (!token.startsWith('var(')) return token
  if (typeof window === 'undefined') return '#8b949e'
  const name = token.slice(4, -1).trim()
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || '#8b949e'
}

/** Append an alpha channel (00-ff) to a hex color. */
function withAlpha(color: string, alphaHex: string): string {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    if (color.length === 4) {
      const r = color[1]
      const g = color[2]
      const b = color[3]
      return `#${r}${r}${g}${g}${b}${b}${alphaHex}`
    }
    return `${color}${alphaHex}`
  }
  return color
}

/** Tiers visible on the chart (we keep empty ones in the legend list below). */
const visibleTiers = computed(() => props.tiers.filter((t) => t.count > 0))

const totalUsers = computed(() => props.tiers.reduce((sum, t) => sum + t.count, 0))

function toggleTier(id: PremiumTierId | null) {
  if (id === null) {
    emit('update:selectedTierId', null)
    return
  }
  const next = props.selectedTierId === id ? null : id
  emit('update:selectedTierId', next)
}

function handleLegendClick(tier: PremiumTier) {
  if (tier.count === 0) return
  toggleTier(tier.id)
}

const chartData = computed(() => {
  const selected = props.selectedTierId
  return {
    labels: visibleTiers.value.map((t) => t.label),
    datasets: [
      {
        data: visibleTiers.value.map((t) => t.count),
        backgroundColor: visibleTiers.value.map((t) => {
          const base = resolveColor(t.color)
          if (!selected || t.id === selected) return base
          return withAlpha(base, '33')
        }),
        borderColor: '#161b22',
        borderWidth: 3,
        hoverOffset: 8,
        offset: visibleTiers.value.map((t) => (selected && t.id === selected ? 12 : 0))
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  onHover: (event: ChartEvent, elements: ActiveElement[]) => {
    const target = event.native?.target as HTMLElement | undefined
    if (target?.style) {
      target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
    }
  },
  onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
    const el = elements[0]
    if (!el) return
    const tier = visibleTiers.value[el.index]
    if (!tier) return
    toggleTier(tier.id)
  },
  plugins: {
    legend: {
      display: false as const
    },
    tooltip: {
      backgroundColor: '#161b22',
      borderColor: '#30363d',
      borderWidth: 1,
      titleColor: '#e6edf3',
      bodyColor: '#8b949e',
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        title: (items: TooltipItem<'doughnut'>[]) => {
          const item = items[0]
          if (!item) return ''
          const tier = visibleTiers.value[item.dataIndex]
          if (!tier) return item.label ?? ''
          const total = totalUsers.value
          const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0
          return `${tier.label} — ${tier.count} user${tier.count > 1 ? 's' : ''} (${pct}%)`
        },
        label: (item: TooltipItem<'doughnut'>): string | string[] => {
          const tier = visibleTiers.value[item.dataIndex]
          if (!tier) return ''
          const logins = tier.users.map((u) => u.user_login)
          const shown = logins.slice(0, TOOLTIP_MAX_USERS)
          const remaining = logins.length - shown.length
          const lines = shown.map((l) => `• ${l}`)
          if (remaining > 0) lines.push(`+ ${remaining} autre${remaining > 1 ? 's' : ''}`)
          lines.push('')
          lines.push('Cliquer pour filtrer la liste')
          return lines
        }
      }
    }
  }
}))
</script>

<template>
  <div class="distribution-chart">
    <div class="chart-area">
      <Doughnut v-if="visibleTiers.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else class="empty-state">
        <p>Aucune donnée d'utilisation premium</p>
      </div>
      <div v-if="visibleTiers.length > 0" class="chart-center">
        <span class="center-value">{{ totalUsers }}</span>
        <span class="center-label">utilisateur{{ totalUsers > 1 ? 's' : '' }}</span>
      </div>
    </div>

    <ul class="tier-legend">
      <li
        v-for="tier in props.tiers"
        :key="tier.id"
        class="tier-legend-item"
        :class="{
          'tier-empty': tier.count === 0,
          'tier-active': tier.id === props.selectedTierId,
          'tier-dimmed':
            props.selectedTierId !== null &&
            props.selectedTierId !== undefined &&
            tier.id !== props.selectedTierId &&
            tier.count > 0
        }"
        :style="
          tier.id === props.selectedTierId
            ? { borderColor: resolveColor(tier.color) }
            : undefined
        "
        :title="tier.count === 0 ? 'Aucun utilisateur' : 'Cliquer pour filtrer la liste'"
        @click="handleLegendClick(tier)"
      >
        <span class="tier-dot" :style="{ backgroundColor: resolveColor(tier.color) }"></span>
        <span class="tier-label">{{ tier.label }}</span>
        <span class="tier-count">{{ tier.count }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.distribution-chart {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.5rem;
  height: 100%;
  align-items: center;
}

@media (max-width: 600px) {
  .distribution-chart {
    grid-template-columns: 1fr;
  }
}

.chart-area {
  position: relative;
  height: 240px;
  width: 100%;
  min-width: 0;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.center-value {
  font-size: 1.875rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  line-height: 1;
}

.center-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.tier-legend {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  min-width: 130px;
}

.tier-legend-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-tertiary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.tier-legend-item:hover:not(.tier-empty) {
  background-color: var(--color-bg-primary);
}

.tier-legend-item.tier-active {
  background-color: var(--color-bg-primary);
}

.tier-legend-item.tier-dimmed {
  opacity: 0.45;
}

.tier-legend-item.tier-empty {
  opacity: 0.4;
  cursor: not-allowed;
}

.tier-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.tier-label {
  color: var(--color-text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.tier-count {
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
  font-weight: 600;
}
</style>
