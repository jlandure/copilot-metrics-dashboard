// Types for GitHub Copilot Usage Metrics

export interface PluginVersion {
  sampled_at: string
  plugin: string
  plugin_version: string
}

export interface IdeVersion {
  sampled_at: string
  ide_version: string
}

export interface TotalsByIde {
  ide: string
  user_initiated_interaction_count: number
  code_generation_activity_count: number
  code_acceptance_activity_count: number
  loc_suggested_to_add_sum: number
  loc_suggested_to_delete_sum: number
  loc_added_sum: number
  loc_deleted_sum: number
  last_known_plugin_version?: PluginVersion
  last_known_ide_version?: IdeVersion
}

export interface TotalsByFeature {
  feature: string
  user_initiated_interaction_count: number
  code_generation_activity_count: number
  code_acceptance_activity_count: number
  loc_suggested_to_add_sum: number
  loc_suggested_to_delete_sum: number
  loc_added_sum: number
  loc_deleted_sum: number
}

export interface TotalsByLanguageFeature {
  language: string
  feature: string
  code_generation_activity_count: number
  code_acceptance_activity_count: number
  loc_suggested_to_add_sum: number
  loc_suggested_to_delete_sum: number
  loc_added_sum: number
  loc_deleted_sum: number
}

export interface TotalsByLanguageModel {
  language: string
  model: string
  code_generation_activity_count: number
  code_acceptance_activity_count: number
  loc_suggested_to_add_sum: number
  loc_suggested_to_delete_sum: number
  loc_added_sum: number
  loc_deleted_sum: number
}

export interface CopilotMetric {
  report_start_day: string
  report_end_day: string
  day: string
  enterprise_id: string
  user_id: number
  user_login: string
  user_initiated_interaction_count: number
  code_generation_activity_count: number
  code_acceptance_activity_count: number
  totals_by_ide: TotalsByIde[]
  totals_by_feature: TotalsByFeature[]
  totals_by_language_feature: TotalsByLanguageFeature[]
  totals_by_language_model?: TotalsByLanguageModel[]
}

// Aggregated types for dashboard display

export interface UserSummary {
  user_login: string
  user_id: number
  total_interactions: number
  total_code_generated: number
  total_code_accepted: number
  acceptance_rate: number
  active_days: number
  last_active_day: string
  primary_ide: string
  loc_added: number
  loc_suggested: number
}

export interface DailyMetrics {
  day: string
  active_users: number
  total_interactions: number
  total_code_generated: number
  total_code_accepted: number
  acceptance_rate: number
}

export interface FeatureMetrics {
  feature: string
  interactions: number
  code_generated: number
  code_accepted: number
  acceptance_rate: number
}

export interface IdeMetrics {
  ide: string
  users: number
  interactions: number
  code_generated: number
  code_accepted: number
}

export interface LanguageMetrics {
  language: string
  code_generated: number
  code_accepted: number
  acceptance_rate: number
}

export interface GlobalStats {
  total_users: number
  total_interactions: number
  total_code_generated: number
  total_code_accepted: number
  average_acceptance_rate: number
  report_start_day: string
  report_end_day: string
  total_loc_added: number
  total_loc_suggested: number
}
