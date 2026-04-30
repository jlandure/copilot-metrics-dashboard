import { computed, ref, watch } from 'vue'
import type {
  CopilotPlan,
  CopilotPlanId,
  MultiplierVersion,
  PeriodMode,
  PremiumSettings
} from '@/types/premium'
import {
  COPILOT_PLANS,
  DEFAULT_MULTIPLIER_VERSION,
  DEFAULT_PERIOD_MODE,
  DEFAULT_PLAN_ID,
  DEFAULT_UNKNOWN_MULTIPLIER,
  MODEL_REGISTRY
} from '@/constants/premiumModels'

const STORAGE_KEY = 'copilot-premium-settings-v1'

function defaultSettings(): PremiumSettings {
  const plan = COPILOT_PLANS.find((p) => p.id === DEFAULT_PLAN_ID)
  return {
    planId: DEFAULT_PLAN_ID,
    customQuota: plan?.monthlyQuota ?? 1000,
    multiplierVersion: DEFAULT_MULTIPLIER_VERSION,
    overrides: {},
    unknownMultiplier: DEFAULT_UNKNOWN_MULTIPLIER,
    periodMode: DEFAULT_PERIOD_MODE
  }
}

function loadSettings(): PremiumSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw) as Partial<PremiumSettings>
    return { ...defaultSettings(), ...parsed }
  } catch (e) {
    console.warn('Failed to load premium settings:', e)
    return defaultSettings()
  }
}

const settings = ref<PremiumSettings>(loadSettings())

watch(
  settings,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch (e) {
      console.warn('Failed to persist premium settings:', e)
    }
  },
  { deep: true }
)

export function usePremiumSettings() {
  const fallbackPlan: CopilotPlan = COPILOT_PLANS[COPILOT_PLANS.length - 1] ?? {
    id: 'enterprise',
    label: 'Copilot Enterprise',
    monthlyQuota: 1000
  }

  const currentPlan = computed<CopilotPlan>(() => {
    return COPILOT_PLANS.find((p) => p.id === settings.value.planId) ?? fallbackPlan
  })

  /** Effective monthly quota (custom plan reads from `customQuota`). */
  const monthlyQuota = computed<number>(() => {
    if (settings.value.planId === 'custom') return settings.value.customQuota
    return currentPlan.value.monthlyQuota
  })

  /**
   * Returns the effective multiplier for a model id, taking user overrides
   * into account. `null` means the model is not in the registry.
   */
  function getMultiplier(modelId: string): number | null {
    const entry = MODEL_REGISTRY.find((m) => m.id === modelId)
    if (!entry) return null
    const override = settings.value.overrides[modelId]
    const version = settings.value.multiplierVersion
    return override?.[version] ?? entry[version]
  }

  function setPlan(planId: CopilotPlanId) {
    settings.value = { ...settings.value, planId }
  }

  function setCustomQuota(value: number) {
    settings.value = {
      ...settings.value,
      customQuota: Math.max(0, Math.round(value))
    }
  }

  function setMultiplierVersion(version: MultiplierVersion) {
    settings.value = { ...settings.value, multiplierVersion: version }
  }

  function setUnknownMultiplier(value: number) {
    settings.value = { ...settings.value, unknownMultiplier: Math.max(0, value) }
  }

  function setPeriodMode(mode: PeriodMode) {
    settings.value = { ...settings.value, periodMode: mode }
  }

  function setOverride(modelId: string, version: MultiplierVersion, value: number | null) {
    const next = { ...settings.value.overrides }
    const existing = next[modelId] ?? {}
    if (value === null || Number.isNaN(value)) {
      delete existing[version]
    } else {
      existing[version] = Math.max(0, value)
    }
    if (Object.keys(existing).length === 0) {
      delete next[modelId]
    } else {
      next[modelId] = existing
    }
    settings.value = { ...settings.value, overrides: next }
  }

  function resetOverrides() {
    settings.value = { ...settings.value, overrides: {} }
  }

  function resetAll() {
    settings.value = defaultSettings()
  }

  return {
    settings,
    plans: COPILOT_PLANS,
    currentPlan,
    monthlyQuota,
    getMultiplier,
    setPlan,
    setCustomQuota,
    setMultiplierVersion,
    setUnknownMultiplier,
    setPeriodMode,
    setOverride,
    resetOverrides,
    resetAll
  }
}
