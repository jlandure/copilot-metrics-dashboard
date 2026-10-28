<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import type { CustomizationCatalog, CustomizationEntry, CustomizationKind } from '@/types/copilot'

const props = defineProps<{
  catalogs: CustomizationCatalog[]
  /** Organization ranks by users. A single user ranks by active days. */
  scope: 'organization' | 'user'
}>()

const TOP_LIMIT = 8
const TAB_ORDER: CustomizationKind[] = [
  'mcp',
  'skill',
  'custom_agent',
  'plugin',
  'slash_cmd'
]

const KIND_LABEL: Record<CustomizationKind, string> = {
  mcp: 'MCP servers',
  skill: 'Skills',
  custom_agent: 'Custom agents',
  plugin: 'Plugins',
  slash_cmd: 'Slash commands'
}

const KIND_NOUN: Record<CustomizationKind, readonly [string, string]> = {
  mcp: ['MCP server', 'MCP servers'],
  skill: ['skill', 'skills'],
  custom_agent: ['custom agent', 'custom agents'],
  plugin: ['plugin', 'plugins'],
  slash_cmd: ['slash command', 'slash commands']
}

type RankBy = 'interactions' | 'reach'
type SortKey = 'name' | 'interactions' | 'reach'

const baseId = useId()
const rankBy = ref<RankBy>('interactions')
const activeKind = ref<CustomizationKind>('mcp')
const filter = ref('')
const sortKey = ref<SortKey>('interactions')
const sortDir = ref<'asc' | 'desc'>('desc')

const numberFormat = new Intl.NumberFormat('en-US')

const reachWord = computed(() => (props.scope === 'user' ? 'active days' : 'users'))
const reachTitle = computed(() => (props.scope === 'user' ? 'Active days' : 'Users'))
const reachToggle = computed(() => (props.scope === 'user' ? 'By active days' : 'By users'))

const orderedCatalogs = computed(() =>
  TAB_ORDER.flatMap((kind) => {
    const catalog = props.catalogs.find((item) => item.kind === kind)
    return catalog ? [catalog] : []
  })
)

const hasAny = computed(() => props.catalogs.some((catalog) => catalog.entries.length > 0))

const activeCatalog = computed(
  () => orderedCatalogs.value.find((catalog) => catalog.kind === activeKind.value) ?? orderedCatalogs.value[0]
)

watch(activeKind, () => {
  filter.value = ''
})

const filteredEntries = computed(() => {
  const catalog = activeCatalog.value
  if (!catalog) return []
  const query = filter.value.trim().toLowerCase()
  const rows = query
    ? catalog.entries.filter((entry) => entry.name.toLowerCase().includes(query))
    : catalog.entries.slice()

  const dir = sortDir.value === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    if (sortKey.value === 'name') return a.name.localeCompare(b.name) * dir
    const aValue = metricValue(a, sortKey.value === 'reach' ? 'reach' : 'interactions')
    const bValue = metricValue(b, sortKey.value === 'reach' ? 'reach' : 'interactions')
    return (aValue - bValue) * dir || a.name.localeCompare(b.name)
  })
  return rows
})

const namedInView = computed(
  () => activeCatalog.value?.entries.filter((entry) => !entry.bucket).length ?? 0
)

function metricValue(entry: CustomizationEntry, rank: RankBy): number {
  return rank === 'interactions' ? entry.interactions : props.scope === 'user' ? entry.activeDays : entry.users
}

function formatNumber(value: number): string {
  return numberFormat.format(value)
}

function catalogByKind(kind: CustomizationKind): CustomizationCatalog | undefined {
  return props.catalogs.find((catalog) => catalog.kind === kind)
}

function topEntries(kind: CustomizationKind): CustomizationEntry[] {
  const catalog = catalogByKind(kind)
  if (!catalog) return []
  const primary = rankBy.value
  const secondary: RankBy = primary === 'interactions' ? 'reach' : 'interactions'
  return catalog.entries
    .filter((entry) => !entry.bucket)
    .sort(
      (a, b) =>
        metricValue(b, primary) - metricValue(a, primary) ||
        metricValue(b, secondary) - metricValue(a, secondary) ||
        a.name.localeCompare(b.name)
    )
    .slice(0, TOP_LIMIT)
}

function barWidth(entry: CustomizationEntry, rows: CustomizationEntry[]): string {
  const max = rows.reduce((peak, row) => Math.max(peak, metricValue(row, rankBy.value)), 0)
  if (max <= 0) return '0%'
  return `${Math.max(4, Math.round((metricValue(entry, rankBy.value) / max) * 100))}%`
}

function secondaryText(entry: CustomizationEntry): string {
  if (rankBy.value === 'interactions') {
    const value = metricValue(entry, 'reach')
    return `${formatNumber(value)} ${value === 1 ? reachWord.value.replace(/s$/, '') : reachWord.value}`
  }
  const value = entry.interactions
  return `${formatNumber(value)} ${value === 1 ? 'interaction' : 'interactions'}`
}

function groupedNote(kind: CustomizationKind): string | null {
  const catalog = catalogByKind(kind)
  if (!catalog || catalog.bucketInteractions <= 0) return null
  const interactions = formatNumber(catalog.bucketInteractions)
  if (props.scope === 'user') {
    return `${interactions} interactions are still grouped as other or custom.`
  }
  const users = catalog.bucketUserCount
  return `${interactions} interactions from ${formatNumber(users)} ${users === 1 ? 'user' : 'users'} are still grouped as other or custom.`
}

function summary(kind: CustomizationKind): string {
  const catalog = catalogByKind(kind)
  if (!catalog) return ''
  const names = catalog.entries.filter((entry) => !entry.bucket).length
  const noun = KIND_NOUN[kind][names === 1 ? 0 : 1]
  if (props.scope === 'user') {
    return `${formatNumber(names)} named ${noun} · ${formatNumber(catalog.namedInteractions)} interactions`
  }
  return `${formatNumber(names)} named · ${formatNumber(catalog.namedUserCount)} users · ${formatNumber(catalog.namedInteractions)} interactions`
}

function tabId(kind: CustomizationKind): string {
  return `${baseId}-tab-${kind}`
}

function panelId(kind: CustomizationKind): string {
  return `${baseId}-panel-${kind}`
}

function captionId(kind: CustomizationKind): string {
  return `${baseId}-caption-${kind}`
}

function selectTab(kind: CustomizationKind) {
  activeKind.value = kind
}

function focusTab(kind: CustomizationKind) {
  document.getElementById(tabId(kind))?.focus()
}

function onTabKeydown(event: KeyboardEvent, index: number) {
  const kinds = orderedCatalogs.value.map((catalog) => catalog.kind)
  const last = kinds.length - 1
  let next = index
  if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
  else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = last
  else return

  event.preventDefault()
  const kind = kinds[next]
  if (!kind) return
  activeKind.value = kind
  nextTick(() => focusTab(kind))
}

function onRankKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  event.preventDefault()
  rankBy.value = rankBy.value === 'interactions' ? 'reach' : 'interactions'
  nextTick(() => {
    document.getElementById(`${baseId}-rank-${rankBy.value}`)?.focus()
  })
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'name' ? 'asc' : 'desc'
  }
}

function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

const rankLabel = computed(() =>
  rankBy.value === 'interactions' ? 'interactions' : reachWord.value
)

const heroCards = computed(() =>
  (['mcp', 'skill'] as const).map((kind) => ({
    kind,
    title: kind === 'mcp' ? 'Top MCP servers' : 'Top skills',
    rows: topEntries(kind)
  }))
)
</script>

<template>
  <section class="customizations" :aria-labelledby="`${baseId}-title`">
    <div class="customizations-header">
      <div>
        <h2 :id="`${baseId}-title`" class="section-title">Skills &amp; MCP</h2>
        <p class="section-subtitle">
          <template v-if="scope === 'organization'">
            Named skills and MCP servers in this export. Custom agents, plugins, and slash
            commands are in the list below.
          </template>
          <template v-else>
            Skills, MCP servers, agents, plugins, and slash commands used by this person.
          </template>
        </p>
      </div>
      <div
        v-if="hasAny"
        class="rank-toggle"
        role="radiogroup"
        aria-label="Rank top lists by"
        @keydown="onRankKeydown"
      >
        <button
          :id="`${baseId}-rank-interactions`"
          type="button"
          role="radio"
          :aria-checked="rankBy === 'interactions'"
          :tabindex="rankBy === 'interactions' ? 0 : -1"
          @click="rankBy = 'interactions'"
        >
          By interactions
        </button>
        <button
          :id="`${baseId}-rank-reach`"
          type="button"
          role="radio"
          :aria-checked="rankBy === 'reach'"
          :tabindex="rankBy === 'reach' ? 0 : -1"
          @click="rankBy = 'reach'"
        >
          {{ reachToggle }}
        </button>
      </div>
    </div>

    <p v-if="!hasAny" class="empty-note">
      <template v-if="scope === 'user'">
        No skill, MCP, agent, plugin, or slash-command activity for this person.
      </template>
      <template v-else>
        This export has no skill, MCP, agent, plugin, or slash-command breakdown.
      </template>
    </p>

    <template v-else>
      <div class="top-grid">
        <article
          v-for="card in heroCards"
          :key="card.kind"
          class="top-card"
          :class="card.kind === 'mcp' ? 'top-card-mcp' : 'top-card-skill'"
        >
          <header class="top-card-header">
            <h3>{{ card.title }}</h3>
            <p>Ranked by {{ rankLabel }}</p>
          </header>

          <p v-if="card.rows.length === 0" class="empty-note">
            No named {{ card.kind === 'mcp' ? 'MCP servers' : 'skills' }} in this export.
          </p>
          <ol v-else class="top-list">
            <li v-for="(entry, index) in card.rows" :key="entry.name">
              <span class="top-rank">{{ index + 1 }}</span>
              <div class="top-body">
                <div class="top-row">
                  <span class="top-name" :title="entry.name">{{ entry.name }}</span>
                  <span class="top-value">{{ formatNumber(metricValue(entry, rankBy)) }}</span>
                </div>
                <div class="top-track" aria-hidden="true">
                  <span class="top-fill" :style="{ width: barWidth(entry, card.rows) }"></span>
                </div>
                <p class="top-meta">{{ secondaryText(entry) }}</p>
              </div>
            </li>
          </ol>

          <footer class="top-foot">
            <p>{{ summary(card.kind) }}</p>
            <p v-if="groupedNote(card.kind)">{{ groupedNote(card.kind) }}</p>
          </footer>
        </article>
      </div>

      <div class="catalog">
        <div class="tablist" role="tablist" aria-label="Customization lists">
          <button
            v-for="(catalog, index) in orderedCatalogs"
            :id="tabId(catalog.kind)"
            :key="catalog.kind"
            type="button"
            role="tab"
            :aria-selected="activeCatalog?.kind === catalog.kind"
            :aria-controls="panelId(catalog.kind)"
            :tabindex="activeCatalog?.kind === catalog.kind ? 0 : -1"
            @click="selectTab(catalog.kind)"
            @keydown="onTabKeydown($event, index)"
          >
            {{ KIND_LABEL[catalog.kind] }}
            <span class="tab-count">{{ formatNumber(catalog.entries.filter((entry) => !entry.bucket).length) }}</span>
          </button>
        </div>

        <div
          v-if="activeCatalog"
          :id="panelId(activeCatalog.kind)"
          role="tabpanel"
          :aria-labelledby="tabId(activeCatalog.kind)"
          class="tabpanel"
        >
          <div class="catalog-toolbar">
            <label class="filter">
              <span>Filter</span>
              <input
                v-model="filter"
                type="search"
                placeholder="Name"
                autocomplete="off"
              />
            </label>
            <p class="catalog-count">
              {{ formatNumber(filteredEntries.length) }}
              of
              {{ formatNumber(activeCatalog.entries.length) }}
              <template v-if="activeCatalog.bucketInteractions > 0">
                · {{ formatNumber(namedInView) }} named
              </template>
            </p>
          </div>

          <p v-if="filteredEntries.length === 0" class="empty-note">No matches.</p>
          <div
            v-else
            class="table-wrap"
            tabindex="0"
            role="region"
            :aria-labelledby="captionId(activeCatalog.kind)"
          >
            <table>
              <caption :id="captionId(activeCatalog.kind)">
                {{ KIND_LABEL[activeCatalog.kind] }}
              </caption>
              <thead>
                <tr>
                  <th scope="col" :aria-sort="ariaSort('name')">
                    <button type="button" @click="toggleSort('name')">Name</button>
                  </th>
                  <th scope="col" :aria-sort="ariaSort('interactions')">
                    <button type="button" @click="toggleSort('interactions')">Interactions</button>
                  </th>
                  <th scope="col" :aria-sort="ariaSort('reach')">
                    <button type="button" @click="toggleSort('reach')">{{ reachTitle }}</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in filteredEntries" :key="entry.name" :class="{ 'is-bucket': entry.bucket }">
                  <th scope="row">
                    <span class="entry-name" :title="entry.name">{{ entry.name }}</span>
                    <span v-if="entry.bucket" class="bucket-tag">Grouped</span>
                  </th>
                  <td data-label="Interactions">{{ formatNumber(entry.interactions) }}</td>
                  <td :data-label="reachTitle">
                    {{ formatNumber(scope === 'user' ? entry.activeDays : entry.users) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.customizations {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.customizations-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.section-subtitle {
  margin-top: 0.25rem;
  max-width: 42rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.rank-toggle {
  display: inline-flex;
  padding: 0.2rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.rank-toggle button {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.rank-toggle button[aria-checked='true'] {
  background: var(--color-accent-blue);
  color: #fff;
}

.top-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.top-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.25rem 1rem;
  min-width: 0;
}

.top-card-header h3 {
  font-size: 1rem;
  font-weight: 600;
}

.top-card-header p {
  margin-top: 0.15rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.top-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin: 1rem 0 0.85rem;
  flex: 1;
}

.top-list li {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr);
  gap: 0.65rem;
  align-items: start;
}

.top-rank {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  padding-top: 0.15rem;
}

.top-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.top-name {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-value {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.top-track {
  margin-top: 0.3rem;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
}

.top-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-accent-blue);
}

.top-card-skill .top-fill {
  background: var(--color-accent-purple);
}

.top-meta {
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.top-foot {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.catalog {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tablist {
  display: flex;
  gap: 0.15rem;
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
  padding: 0 0.5rem;
}

.tablist button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex: 0 0 auto;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.8rem 0.75rem;
  cursor: pointer;
  margin-bottom: -1px;
}

.tablist button[aria-selected='true'] {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-accent-blue);
}

.tab-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.tabpanel {
  padding: 1rem 1rem 1.1rem;
}

.catalog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.filter input {
  width: min(18rem, 70vw);
  padding: 0.4rem 0.65rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font: inherit;
  font-size: 0.875rem;
}

.filter input:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 1px;
}

.catalog-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.table-wrap {
  overflow: auto;
  max-inline-size: 100%;
  max-block-size: min(32rem, 70vh);
  container-type: inline-size;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table-wrap:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 2px;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

caption {
  caption-side: top;
  text-align: left;
  padding: 0.65rem 0.85rem 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
}

thead {
  position: sticky;
  inset-block-start: 0;
  z-index: 2;
}

th,
td {
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: middle;
}

thead th {
  background: var(--color-bg-tertiary);
}

thead button {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  padding: 0.15rem 0;
}

thead th[aria-sort='ascending'] button::after,
thead th[aria-sort='descending'] button::after {
  margin-left: 0.35rem;
  color: var(--color-text-primary);
}

thead th[aria-sort='descending'] button::after {
  content: '↓';
}

thead th[aria-sort='ascending'] button::after {
  content: '↑';
}

tbody th {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  background: var(--color-bg-secondary);
  font-weight: 500;
  max-width: 28rem;
}

td {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.entry-name {
  display: inline-block;
  max-width: 26rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

.is-bucket .entry-name {
  color: var(--color-text-secondary);
}

.bucket-tag {
  display: inline-block;
  margin-left: 0.45rem;
  padding: 0.05rem 0.4rem;
  border-radius: var(--radius-sm);
  background: rgba(210, 153, 34, 0.16);
  color: var(--color-accent-yellow);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  vertical-align: middle;
}

.empty-note {
  padding: 0.75rem 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

button:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .top-fill {
    transition: none;
  }
}

@container (width < 640px) {
  table,
  thead,
  tbody,
  tr,
  th,
  td {
    display: block;
  }

  thead {
    display: none;
  }

  caption {
    position: static;
  }

  tbody tr {
    padding: 0.35rem 0 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  tbody th,
  td {
    border-bottom: 0;
    background: transparent;
    position: static;
    max-width: none;
  }

  tbody th {
    padding-bottom: 0.15rem;
  }

  td {
    padding-top: 0.15rem;
    padding-bottom: 0.15rem;
  }

  td::before {
    content: attr(data-label) ': ';
    color: var(--color-text-muted);
    font-family: var(--font-family);
    font-size: 0.75rem;
  }

  .entry-name {
    max-width: 100%;
    white-space: normal;
  }
}

@media (max-width: 900px) {
  .top-grid {
    grid-template-columns: 1fr;
  }

  .top-row {
    align-items: flex-start;
  }

  .top-name {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    overflow-wrap: anywhere;
  }
}
</style>
