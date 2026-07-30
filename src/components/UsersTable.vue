<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import type { UserSummary } from '@/types/copilot'
import { useAiCreditsEstimate } from '@/composables/useAiCreditsEstimate'

const props = defineProps<{
  users: UserSummary[]
  loading?: boolean
}>()

const router = useRouter()

const { byUser } = useAiCreditsEstimate()

interface UserRow extends UserSummary {
  ai_credits: number
  ai_cost_usd: number
  ai_included_credits: number
  ai_overage_credits: number
  ai_overage_cost_usd: number
}

const aiCreditsByLogin = computed(() => {
  const map = new Map<string, (typeof byUser.value)[number]>()
  for (const row of byUser.value) map.set(row.login, row)
  return map
})

const rows = computed<UserRow[]>(() =>
  props.users.map((user) => {
    const ai = aiCreditsByLogin.value.get(user.user_login)
    return {
      ...user,
      ai_credits: ai?.aiCredits ?? 0,
      ai_cost_usd: ai?.costUsd ?? 0,
      ai_included_credits: ai?.includedCredits ?? 0,
      ai_overage_credits: ai?.overageCredits ?? 0,
      ai_overage_cost_usd: ai?.overageCostUsd ?? 0
    }
  })
)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  user_login: { value: null, matchMode: FilterMatchMode.CONTAINS },
  primary_ide: { value: null, matchMode: FilterMatchMode.CONTAINS },
  adoption_phase: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const num2 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function navigateToUser(user: UserRow) {
  router.push({ name: 'user-detail', params: { userLogin: user.user_login } })
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function formatCredits(value: number): string {
  return num2.format(value)
}

function formatUsd(value: number): string {
  return usd.format(value)
}

function getInitials(login: string): string {
  return login.slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <div>
        <h3 class="dashboard-card-title">Users</h3>
        <p class="dashboard-card-subtitle">Activity by developer</p>
      </div>
    </div>

    <DataTable
      :value="rows"
      :loading="loading"
      v-model:filters="filters"
      filterDisplay="row"
      :globalFilterFields="['user_login', 'primary_ide', 'adoption_phase']"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      sortField="ai_credits"
      :sortOrder="-1"
      dataKey="user_id"
      removableSort
      @row-click="(event: { data: UserRow }) => navigateToUser(event.data)"
      class="users-table"
      :pt="{
        table: { style: 'min-width: 80rem' },
        bodyRow: { style: 'cursor: pointer' }
      }"
    >
      <template #header>
        <div class="table-header">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters['global'].value"
              placeholder="Search for a user..."
            />
          </IconField>
        </div>
      </template>

      <template #empty>
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <p>No users found</p>
        </div>
      </template>

      <template #loading>
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </template>

      <Column field="user_login" header="User" sortable style="min-width: 14rem">
        <template #body="{ data }">
          <div class="user-link">
            <div class="user-avatar">{{ getInitials(data.user_login) }}</div>
            <span>{{ data.user_login }}</span>
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            @input="filterCallback()"
            placeholder="Filter..."
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column field="adoption_phase" header="Adoption" sortable style="min-width: 8rem">
        <template #body="{ data }">
          <Tag
            v-if="data.adoption_phase"
            :value="data.adoption_phase"
            :severity="getPhaseSeverity(data.adoption_phase)"
          />
          <span v-else class="metric-muted">—</span>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            @input="filterCallback()"
            placeholder="Phase..."
            class="p-column-filter"
          />
        </template>
      </Column>

      <Column
        field="total_interactions"
        header="Interactions"
        sortable
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          <span class="metric-value">{{ formatNumber(data.total_interactions) }}</span>
        </template>
      </Column>

      <Column field="active_days" header="Active Days" sortable style="min-width: 6rem">
        <template #body="{ data }">
          <Tag :value="`${data.active_days} days`" severity="info" />
        </template>
      </Column>

      <Column field="primary_ide" header="Primary IDE" sortable style="min-width: 8rem">
        <template #body="{ data }">
          <Tag :value="data.primary_ide" :severity="getIdeSeverity(data.primary_ide)" />
        </template>
      </Column>

      <Column field="loc_added" header="LOC Added" sortable style="min-width: 8rem">
        <template #body="{ data }">
          <span class="metric-value">{{ formatNumber(data.loc_added) }}</span>
        </template>
      </Column>

      <Column field="loc_suggested" header="LOC Suggested" sortable style="min-width: 8rem">
        <template #body="{ data }">
          <span class="metric-value">{{ formatNumber(data.loc_suggested) }}</span>
        </template>
      </Column>

      <Column
        field="ai_credits"
        header="AI Credits"
        sortable
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          <span class="metric-value purple">{{ formatCredits(data.ai_credits) }}</span>
        </template>
      </Column>

      <Column
        field="ai_cost_usd"
        header="Gross Amount"
        sortable
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          <span class="metric-value strong">{{ formatUsd(data.ai_cost_usd) }}</span>
        </template>
      </Column>

      <Column
        field="ai_overage_cost_usd"
        header="Additional Usage"
        sortable
        style="min-width: 9rem"
      >
        <template #body="{ data }">
          <span
            class="metric-value"
            :class="{ warn: data.ai_overage_cost_usd > 0 }"
          >
            {{ formatUsd(data.ai_overage_cost_usd) }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script lang="ts">
function getIdeSeverity(ide: string): string {
  const severities: Record<string, string> = {
    vscode: 'info',
    'VS Code': 'info',
    intellij: 'warn',
    'IntelliJ IDEA': 'warn',
    neovim: 'success'
  }
  return severities[ide] || 'secondary'
}

function getPhaseSeverity(phase: string): string {
  const severities: Record<string, string> = {
    'Phase 1': 'info',
    'Phase 2': 'warn',
    'Phase 3': 'success',
    'No Cohort': 'secondary'
  }
  return severities[phase] || 'secondary'
}
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: flex-end;
}

.metric-value {
  font-family: var(--font-mono);
  font-weight: 500;
}

.metric-value.green {
  color: var(--color-accent-green);
}

.metric-value.purple {
  color: var(--color-accent-purple);
}

.metric-value.strong {
  color: var(--color-text-primary);
  font-weight: 700;
}

.metric-value.warn {
  color: var(--color-accent-red);
  font-weight: 600;
}

.metric-muted {
  color: var(--color-text-muted);
}

.users-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--color-bg-tertiary) !important;
}

.p-column-filter {
  width: 100%;
}
</style>
