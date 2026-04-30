<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FilterMatchMode } from '@primevue/core/api'
import type { UserSummary } from '@/types/copilot'
import { usePremiumRequests } from '@/composables/usePremiumRequests'

interface EnrichedUser extends UserSummary {
  premium_requests: number
  premium_projected: number
  premium_percent: number
}

const props = defineProps<{
  users: UserSummary[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'open-premium-settings'): void
}>()

const router = useRouter()
const { getUsageForUser, monthlyQuota, projectMonthly } = usePremiumRequests()

const enrichedUsers = computed<EnrichedUser[]>(() =>
  props.users.map((u) => {
    const usage = getUsageForUser(u.user_login)
    const premium = usage?.premium_requests ?? 0
    const projected = projectMonthly(premium)
    const percent = monthlyQuota.value
      ? Math.min(100, (projected / monthlyQuota.value) * 100)
      : 0
    return {
      ...u,
      premium_requests: premium,
      premium_projected: projected,
      premium_percent: percent
    }
  })
)

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

function getPremiumColor(percent: number): string {
  if (percent >= 100) return 'var(--color-accent-red)'
  if (percent >= 80) return 'var(--color-accent-yellow)'
  return 'var(--color-accent-green)'
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function formatDecimal(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-US')
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 })
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
      <button class="settings-btn" type="button" @click="$emit('open-premium-settings')">
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path
            d="M8 0a8.2 8.2 0 01.701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 01-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 01-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 01-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 01-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 01-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 010-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 01.704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 000 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 001.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 000-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 00-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 00-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 00-1.142 0zM11 8a3 3 0 11-6 0 3 3 0 016 0zM9.5 8a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z"
          />
        </svg>
        Premium settings
      </button>
    </div>

    <DataTable
      :value="enrichedUsers"
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
        table: { style: 'min-width: 60rem' },
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

      <Column
        field="premium_requests"
        header="Premium Requests"
        sortable
        style="min-width: 12rem"
      >
        <template #body="{ data }">
          <div class="premium-cell">
            <div class="premium-row-top">
              <span class="metric-value" :style="{ color: getPremiumColor(data.premium_percent) }">
                {{ formatDecimal(data.premium_requests) }}
              </span>
              <span class="premium-percent" :style="{ color: getPremiumColor(data.premium_percent) }">
                {{ data.premium_percent.toFixed(0) }}%
              </span>
            </div>
            <div class="bar mini">
              <div
                class="bar-fill"
                :style="{
                  width: `${data.premium_percent}%`,
                  backgroundColor: getPremiumColor(data.premium_percent)
                }"
              ></div>
            </div>
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

.settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-accent-blue);
}

.premium-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 8rem;
}

.premium-row-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.premium-percent {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
}

.bar.mini {
  height: 5px;
  background-color: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.bar.mini .bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
