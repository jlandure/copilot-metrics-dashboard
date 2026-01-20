import { ref, computed } from 'vue'
import type {
  CopilotMetric,
  UserSummary,
  DailyMetrics,
  FeatureMetrics,
  IdeMetrics,
  LanguageMetrics,
  GlobalStats
} from '@/types/copilot'

const STORAGE_KEY = 'copilot-metrics-data'

function loadFromStorage(): CopilotMetric[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as CopilotMetric[]
    }
  } catch (e) {
    console.warn('Failed to load from sessionStorage:', e)
  }
  return []
}

function saveToStorage(data: CopilotMetric[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save to sessionStorage:', e)
  }
}

const storedMetrics = loadFromStorage()
const metrics = ref<CopilotMetric[]>(storedMetrics)
const loading = ref(false)
const error = ref<string | null>(null)
const isDataLoaded = ref(storedMetrics.length > 0)

export function useCopilotMetrics() {
  // Load metrics from a URL
  const loadMetrics = async (filePath = '/data/metrics.ndjson') => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
      }

      const text = await response.text()
      parseMetricsFromText(text)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error loading metrics:', e)
    } finally {
      loading.value = false
    }
  }

  // Load metrics from raw text (for file upload)
  const loadMetricsFromText = (text: string) => {
    loading.value = true
    error.value = null

    try {
      parseMetricsFromText(text)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du parsing des données'
      console.error('Error parsing metrics:', e)
    } finally {
      loading.value = false
    }
  }

  // Parse NDJSON text into metrics
  const parseMetricsFromText = (text: string) => {
    const lines = text.trim().split('\n').filter((line) => line.trim())

    if (lines.length === 0) {
      throw new Error('Le fichier est vide')
    }

    const parsedMetrics = lines.map((line, index) => {
      try {
        return JSON.parse(line) as CopilotMetric
      } catch {
        throw new Error(`Erreur de parsing à la ligne ${index + 1}`)
      }
    })

    metrics.value = parsedMetrics
    isDataLoaded.value = true
    saveToStorage(parsedMetrics)
  }

  // Clear all data
  const clearMetrics = () => {
    metrics.value = []
    isDataLoaded.value = false
    error.value = null
  }

  // Aggregate metrics by user
  const usersSummary = computed<UserSummary[]>(() => {
    const userMap = new Map<string, UserSummary>()

    for (const metric of metrics.value) {
      const existing = userMap.get(metric.user_login)

      if (existing) {
        existing.total_interactions += metric.user_initiated_interaction_count
        existing.total_code_generated += metric.code_generation_activity_count
        existing.total_code_accepted += metric.code_acceptance_activity_count
        existing.active_days += 1

        // Update last active day
        if (metric.day > existing.last_active_day) {
          existing.last_active_day = metric.day
        }

        // Sum LOC
        for (const ide of metric.totals_by_ide) {
          existing.loc_added += ide.loc_added_sum
          existing.loc_suggested += ide.loc_suggested_to_add_sum
        }
      } else {
        const firstIde = metric.totals_by_ide[0]
        const primaryIde = firstIde ? firstIde.ide : 'unknown'

        let locAdded = 0
        let locSuggested = 0
        for (const ide of metric.totals_by_ide) {
          locAdded += ide.loc_added_sum
          locSuggested += ide.loc_suggested_to_add_sum
        }

        userMap.set(metric.user_login, {
          user_login: metric.user_login,
          user_id: metric.user_id,
          total_interactions: metric.user_initiated_interaction_count,
          total_code_generated: metric.code_generation_activity_count,
          total_code_accepted: metric.code_acceptance_activity_count,
          acceptance_rate: 0,
          active_days: 1,
          last_active_day: metric.day,
          primary_ide: primaryIde,
          loc_added: locAdded,
          loc_suggested: locSuggested
        })
      }
    }

    // Calculate acceptance rates
    const users = Array.from(userMap.values())
    for (const user of users) {
      user.acceptance_rate =
        user.total_code_generated > 0
          ? Math.round((user.total_code_accepted / user.total_code_generated) * 100)
          : 0
    }

    return users.sort((a, b) => b.total_interactions - a.total_interactions)
  })

  // Aggregate metrics by day
  const dailyMetrics = computed<DailyMetrics[]>(() => {
    const dayMap = new Map<
      string,
      {
        users: Set<string>
        interactions: number
        generated: number
        accepted: number
      }
    >()

    for (const metric of metrics.value) {
      const existing = dayMap.get(metric.day)

      if (existing) {
        existing.users.add(metric.user_login)
        existing.interactions += metric.user_initiated_interaction_count
        existing.generated += metric.code_generation_activity_count
        existing.accepted += metric.code_acceptance_activity_count
      } else {
        dayMap.set(metric.day, {
          users: new Set([metric.user_login]),
          interactions: metric.user_initiated_interaction_count,
          generated: metric.code_generation_activity_count,
          accepted: metric.code_acceptance_activity_count
        })
      }
    }

    return Array.from(dayMap.entries())
      .map(([day, data]) => ({
        day,
        active_users: data.users.size,
        total_interactions: data.interactions,
        total_code_generated: data.generated,
        total_code_accepted: data.accepted,
        acceptance_rate:
          data.generated > 0 ? Math.round((data.accepted / data.generated) * 100) : 0
      }))
      .sort((a, b) => a.day.localeCompare(b.day))
  })

  // Aggregate metrics by feature
  const featureMetrics = computed<FeatureMetrics[]>(() => {
    const featureMap = new Map<
      string,
      { interactions: number; generated: number; accepted: number }
    >()

    for (const metric of metrics.value) {
      for (const feature of metric.totals_by_feature) {
        const existing = featureMap.get(feature.feature)

        if (existing) {
          existing.interactions += feature.user_initiated_interaction_count
          existing.generated += feature.code_generation_activity_count
          existing.accepted += feature.code_acceptance_activity_count
        } else {
          featureMap.set(feature.feature, {
            interactions: feature.user_initiated_interaction_count,
            generated: feature.code_generation_activity_count,
            accepted: feature.code_acceptance_activity_count
          })
        }
      }
    }

    return Array.from(featureMap.entries())
      .map(([feature, data]) => ({
        feature: formatFeatureName(feature),
        interactions: data.interactions,
        code_generated: data.generated,
        code_accepted: data.accepted,
        acceptance_rate:
          data.generated > 0 ? Math.round((data.accepted / data.generated) * 100) : 0
      }))
      .sort((a, b) => b.code_generated - a.code_generated)
  })

  // Aggregate metrics by IDE
  const ideMetrics = computed<IdeMetrics[]>(() => {
    const ideMap = new Map<
      string,
      { users: Set<string>; interactions: number; generated: number; accepted: number }
    >()

    for (const metric of metrics.value) {
      for (const ide of metric.totals_by_ide) {
        const existing = ideMap.get(ide.ide)

        if (existing) {
          existing.users.add(metric.user_login)
          existing.interactions += ide.user_initiated_interaction_count
          existing.generated += ide.code_generation_activity_count
          existing.accepted += ide.code_acceptance_activity_count
        } else {
          ideMap.set(ide.ide, {
            users: new Set([metric.user_login]),
            interactions: ide.user_initiated_interaction_count,
            generated: ide.code_generation_activity_count,
            accepted: ide.code_acceptance_activity_count
          })
        }
      }
    }

    return Array.from(ideMap.entries())
      .map(([ide, data]) => ({
        ide: formatIdeName(ide),
        users: data.users.size,
        interactions: data.interactions,
        code_generated: data.generated,
        code_accepted: data.accepted
      }))
      .sort((a, b) => b.users - a.users)
  })

  // Aggregate metrics by language
  const languageMetrics = computed<LanguageMetrics[]>(() => {
    const langMap = new Map<string, { generated: number; accepted: number }>()

    for (const metric of metrics.value) {
      for (const lang of metric.totals_by_language_feature) {
        const existing = langMap.get(lang.language)

        if (existing) {
          existing.generated += lang.code_generation_activity_count
          existing.accepted += lang.code_acceptance_activity_count
        } else {
          langMap.set(lang.language, {
            generated: lang.code_generation_activity_count,
            accepted: lang.code_acceptance_activity_count
          })
        }
      }
    }

    return Array.from(langMap.entries())
      .map(([language, data]) => ({
        language: language.charAt(0).toUpperCase() + language.slice(1),
        code_generated: data.generated,
        code_accepted: data.accepted,
        acceptance_rate:
          data.generated > 0 ? Math.round((data.accepted / data.generated) * 100) : 0
      }))
      .sort((a, b) => b.code_generated - a.code_generated)
  })

  // Global statistics
  const globalStats = computed<GlobalStats>(() => {
    const uniqueUsers = new Set(metrics.value.map((m) => m.user_login))

    let totalInteractions = 0
    let totalGenerated = 0
    let totalAccepted = 0
    let totalLocAdded = 0
    let totalLocSuggested = 0

    for (const metric of metrics.value) {
      totalInteractions += metric.user_initiated_interaction_count
      totalGenerated += metric.code_generation_activity_count
      totalAccepted += metric.code_acceptance_activity_count

      for (const ide of metric.totals_by_ide) {
        totalLocAdded += ide.loc_added_sum
        totalLocSuggested += ide.loc_suggested_to_add_sum
      }
    }

    const firstMetric = metrics.value[0]

    return {
      total_users: uniqueUsers.size,
      total_interactions: totalInteractions,
      total_code_generated: totalGenerated,
      total_code_accepted: totalAccepted,
      average_acceptance_rate:
        totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 100) : 0,
      report_start_day: firstMetric?.report_start_day ?? '',
      report_end_day: firstMetric?.report_end_day ?? '',
      total_loc_added: totalLocAdded,
      total_loc_suggested: totalLocSuggested
    }
  })

  // Get metrics for a specific user
  const getUserMetrics = (userLogin: string) => {
    return computed(() => metrics.value.filter((m) => m.user_login === userLogin))
  }

  return {
    metrics,
    loading,
    error,
    isDataLoaded,
    loadMetrics,
    loadMetricsFromText,
    clearMetrics,
    usersSummary,
    dailyMetrics,
    featureMetrics,
    ideMetrics,
    languageMetrics,
    globalStats,
    getUserMetrics
  }
}

// Helper functions
function formatFeatureName(feature: string): string {
  const names: Record<string, string> = {
    chat_panel_ask_mode: 'Chat - Ask Mode',
    chat_panel_agent_mode: 'Chat - Agent Mode',
    chat_panel_edit_mode: 'Chat - Edit Mode',
    code_completion: 'Code Completion',
    inline_chat: 'Inline Chat'
  }
  return names[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatIdeName(ide: string): string {
  const names: Record<string, string> = {
    vscode: 'VS Code',
    intellij: 'IntelliJ IDEA',
    neovim: 'Neovim',
    vim: 'Vim',
    jetbrains: 'JetBrains'
  }
  return names[ide] || ide.charAt(0).toUpperCase() + ide.slice(1)
}
