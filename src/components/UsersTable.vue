<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import type { UserSummary } from '@/types/copilot'

defineProps<{
  users: UserSummary[]
  loading?: boolean
}>()

const router = useRouter()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  user_login: { value: null, matchMode: FilterMatchMode.CONTAINS },
  primary_ide: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

function navigateToUser(user: UserSummary) {
  router.push({ name: 'user-detail', params: { userLogin: user.user_login } })
}

function getAcceptanceRateColor(rate: number): string {
  if (rate >= 30) return 'var(--color-accent-green)'
  if (rate >= 15) return 'var(--color-accent-yellow)'
  return 'var(--color-accent-red)'
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
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
      :value="users"
      :loading="loading"
      v-model:filters="filters"
      filterDisplay="row"
      :globalFilterFields="['user_login', 'primary_ide']"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      sortField="total_interactions"
      :sortOrder="-1"
      dataKey="user_id"
      removableSort
      @row-click="(event: { data: UserSummary }) => navigateToUser(event.data)"
      class="users-table"
      :pt="{
        table: { style: 'min-width: 50rem' },
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

      <Column
        field="total_code_generated"
        header="Code Generated"
        sortable
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          <span class="metric-value">{{ formatNumber(data.total_code_generated) }}</span>
        </template>
      </Column>

      <Column
        field="total_code_accepted"
        header="Code Accepted"
        sortable
        style="min-width: 8rem"
      >
        <template #body="{ data }">
          <span class="metric-value green">{{ formatNumber(data.total_code_accepted) }}</span>
        </template>
      </Column>

      <Column
        field="acceptance_rate"
        header="Acceptance Rate"
        sortable
        style="min-width: 10rem"
      >
        <template #body="{ data }">
          <div class="acceptance-rate-bar">
            <div class="bar">
              <div
                class="bar-fill"
                :style="{
                  width: `${Math.min(data.acceptance_rate, 100)}%`,
                  backgroundColor: getAcceptanceRateColor(data.acceptance_rate)
                }"
              ></div>
            </div>
            <span
              class="rate-value"
              :style="{ color: getAcceptanceRateColor(data.acceptance_rate) }"
            >
              {{ data.acceptance_rate }}%
            </span>
          </div>
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

.users-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--color-bg-tertiary) !important;
}

.p-column-filter {
  width: 100%;
}
</style>
