<script setup lang="ts">
import { computed } from 'vue'
import { usePremiumSettings } from '@/composables/usePremiumSettings'
import { MODEL_REGISTRY } from '@/constants/premiumModels'
import type { CopilotPlanId, MultiplierVersion, PeriodMode } from '@/types/premium'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const {
  settings,
  plans,
  monthlyQuota,
  setPlan,
  setCustomQuota,
  setMultiplierVersion,
  setUnknownMultiplier,
  setPeriodMode,
  setOverride,
  resetOverrides,
  resetAll
} = usePremiumSettings()

const periodOptions: { id: PeriodMode; label: string; description: string }[] = [
  {
    id: 'all',
    label: 'Toutes les données',
    description: 'Utilise toutes les lignes du fichier, projection à 30 j.'
  },
  {
    id: 'current_month',
    label: 'Mois en cours uniquement',
    description: 'Filtre sur le mois calendaire courant pour comparer à la conso GitHub.'
  }
]

const visibleModel = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
})

const versionOptions: { id: MultiplierVersion; label: string }[] = [
  { id: 'current', label: 'Multiplicateurs actuels' },
  { id: 'new', label: 'Nouveaux multiplicateurs' }
]

function effectiveMultiplier(modelId: string, version: MultiplierVersion): number {
  const override = settings.value.overrides[modelId]?.[version]
  if (override !== undefined) return override
  const entry = MODEL_REGISTRY.find((m) => m.id === modelId)
  return entry ? entry[version] : 0
}

function isOverridden(modelId: string, version: MultiplierVersion): boolean {
  return settings.value.overrides[modelId]?.[version] !== undefined
}

function handleMultiplierInput(
  modelId: string,
  version: MultiplierVersion,
  event: Event
) {
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    setOverride(modelId, version, null)
    return
  }
  const value = Number(raw)
  if (Number.isNaN(value)) return
  setOverride(modelId, version, value)
}

function clearOverride(modelId: string, version: MultiplierVersion) {
  setOverride(modelId, version, null)
}

function close() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    modal
    :style="{ width: '95vw', maxWidth: '900px' }"
    :pt="{
      mask: { style: 'backdrop-filter: blur(4px)' }
    }"
  >
    <template #header>
      <div class="dialog-header">
        <h2 class="dialog-title">Réglages des Premium Requests</h2>
        <p class="dialog-subtitle">
          Plan, multiplicateurs et estimation. Tous les changements sont sauvegardés
          automatiquement dans ce navigateur.
        </p>
      </div>
    </template>

    <div class="settings-body">
      <!-- Plan -->
      <section class="section">
        <h3 class="section-title">Plan Copilot</h3>
        <div class="plan-grid">
          <label
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :data-active="settings.planId === plan.id"
          >
            <input
              type="radio"
              name="plan"
              :value="plan.id"
              :checked="settings.planId === plan.id"
              @change="setPlan(plan.id as CopilotPlanId)"
            />
            <div class="plan-content">
              <span class="plan-label">{{ plan.label }}</span>
              <span class="plan-quota">
                <template v-if="plan.id === 'custom'">Quota personnalisé</template>
                <template v-else>{{ plan.monthlyQuota.toLocaleString('fr-FR') }} req/mois</template>
              </span>
            </div>
          </label>
        </div>

        <div v-if="settings.planId === 'custom'" class="custom-quota">
          <label for="custom-quota">Quota mensuel personnalisé</label>
          <input
            id="custom-quota"
            type="number"
            min="0"
            step="50"
            :value="settings.customQuota"
            @input="setCustomQuota(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="hint">requêtes / mois</span>
        </div>

        <p class="quota-summary">
          Quota effectif : <strong>{{ monthlyQuota.toLocaleString('fr-FR') }}</strong>
          premium requests par mois
        </p>
      </section>

      <!-- Version -->
      <section class="section">
        <h3 class="section-title">Barème de multiplicateurs</h3>
        <div class="version-toggle">
          <button
            v-for="opt in versionOptions"
            :key="opt.id"
            type="button"
            class="version-btn"
            :data-active="settings.multiplierVersion === opt.id"
            @click="setMultiplierVersion(opt.id)"
          >
            {{ opt.label }}
          </button>
        </div>
        <p class="hint">
          Bascule entre le barème actuellement en vigueur et le barème annoncé par GitHub.
        </p>
      </section>

      <!-- Period scope -->
      <section class="section">
        <h3 class="section-title">Période de calcul</h3>
        <div class="plan-grid">
          <label
            v-for="opt in periodOptions"
            :key="opt.id"
            class="plan-card"
            :data-active="settings.periodMode === opt.id"
          >
            <input
              type="radio"
              name="period-mode"
              :value="opt.id"
              :checked="settings.periodMode === opt.id"
              @change="setPeriodMode(opt.id)"
            />
            <div class="plan-content">
              <span class="plan-label">{{ opt.label }}</span>
              <span class="plan-quota">{{ opt.description }}</span>
            </div>
          </label>
        </div>
        <p class="hint">
          Choisis "Mois en cours" si tu veux comparer pile à ce que GitHub affiche dans
          le panneau Copilot (qui se réinitialise au début de chaque mois).
        </p>
      </section>

      <!-- Grid -->
      <section class="section">
        <div class="section-header">
          <h3 class="section-title" style="margin: 0">Grille des multiplicateurs</h3>
          <button type="button" class="link-btn" @click="resetOverrides">
            Réinitialiser mes surcharges
          </button>
        </div>

        <div class="grid-wrapper">
          <table class="multipliers-grid">
            <thead>
              <tr>
                <th>Modèle</th>
                <th class="num">Current</th>
                <th class="num">New</th>
                <th class="num">Effectif</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="model in MODEL_REGISTRY" :key="model.id">
                <td class="model-cell">
                  <div class="model-name">{{ model.displayName }}</div>
                  <div class="model-id">{{ model.id }}</div>
                </td>
                <td class="num">
                  <div class="input-wrapper" :data-overridden="isOverridden(model.id, 'current')">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      :value="effectiveMultiplier(model.id, 'current')"
                      @input="handleMultiplierInput(model.id, 'current', $event)"
                    />
                    <button
                      v-if="isOverridden(model.id, 'current')"
                      type="button"
                      class="clear-btn"
                      title="Retirer la surcharge"
                      @click="clearOverride(model.id, 'current')"
                    >
                      ×
                    </button>
                  </div>
                </td>
                <td class="num">
                  <div class="input-wrapper" :data-overridden="isOverridden(model.id, 'new')">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      :value="effectiveMultiplier(model.id, 'new')"
                      @input="handleMultiplierInput(model.id, 'new', $event)"
                    />
                    <button
                      v-if="isOverridden(model.id, 'new')"
                      type="button"
                      class="clear-btn"
                      title="Retirer la surcharge"
                      @click="clearOverride(model.id, 'new')"
                    >
                      ×
                    </button>
                  </div>
                </td>
                <td class="num">
                  <span class="effective-pill">
                    {{ effectiveMultiplier(model.id, settings.multiplierVersion) }}×
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Unknown -->
      <section class="section">
        <h3 class="section-title">Modèles non listés (`auto`, `unknown`…)</h3>
        <div class="unknown-row">
          <label for="unknown-mult">Multiplicateur par défaut</label>
          <input
            id="unknown-mult"
            type="number"
            min="0"
            step="0.01"
            :value="settings.unknownMultiplier"
            @input="setUnknownMultiplier(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="hint">
            Appliqué aux interactions des modèles dont l'ID n'est pas dans la grille.
          </span>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button type="button" class="link-btn" @click="resetAll">
          Réinitialiser tous les réglages
        </button>
        <button type="button" class="primary-btn" @click="close">Fermer</button>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.625rem;
}

.plan-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.plan-card:hover {
  border-color: var(--color-accent-blue);
}

.plan-card[data-active='true'] {
  border-color: var(--color-accent-blue);
  background-color: rgba(31, 111, 235, 0.12);
}

.plan-card input {
  margin: 0;
  accent-color: var(--color-accent-blue);
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.plan-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.875rem;
}

.plan-quota {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}

.custom-quota {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.custom-quota label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.custom-quota input {
  width: 120px;
  padding: 0.375rem 0.5rem;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.quota-summary {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.quota-summary strong {
  color: var(--color-accent-blue);
  font-family: var(--font-mono);
}

.version-toggle {
  display: inline-flex;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.25rem;
  gap: 0.25rem;
  width: fit-content;
}

.version-btn {
  padding: 0.4rem 0.875rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.version-btn:hover {
  color: var(--color-text-primary);
}

.version-btn[data-active='true'] {
  background-color: var(--color-accent-blue);
  color: white;
}

.hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.grid-wrapper {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: auto;
  max-height: 380px;
}

.multipliers-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.multipliers-grid thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.multipliers-grid thead th {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  text-align: left;
  font-weight: 600;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
}

.multipliers-grid th.num,
.multipliers-grid td.num {
  text-align: right;
  font-family: var(--font-mono);
}

.multipliers-grid tbody td {
  padding: 0.5rem 0.875rem;
  border-bottom: 1px solid var(--color-border-muted);
}

.multipliers-grid tbody tr:last-child td {
  border-bottom: none;
}

.multipliers-grid tbody tr:hover {
  background-color: var(--color-bg-tertiary);
}

.model-cell {
  min-width: 200px;
}

.model-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.model-id {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.input-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
}

.input-wrapper input {
  width: 80px;
  padding: 0.3rem 0.5rem;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  text-align: right;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-accent-blue);
  box-shadow: 0 0 0 2px rgba(31, 111, 235, 0.3);
}

.input-wrapper[data-overridden='true'] input {
  border-color: var(--color-accent-yellow);
  background-color: rgba(210, 153, 34, 0.08);
}

.clear-btn {
  position: absolute;
  right: -22px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-accent-yellow);
  font-size: 1rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.effective-pill {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background-color: rgba(31, 111, 235, 0.15);
  color: #58a6ff;
  font-weight: 600;
  font-size: 0.8125rem;
}

.unknown-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
  padding: 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.unknown-row label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.unknown-row input {
  width: 80px;
  padding: 0.3rem 0.5rem;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--color-accent-yellow);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.link-btn:hover {
  background-color: rgba(210, 153, 34, 0.1);
}

.primary-btn {
  padding: 0.5rem 1.25rem;
  background-color: var(--color-accent-blue);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.primary-btn:hover {
  background-color: #1a5fcf;
}
</style>
