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

export interface TotalsByModelFeature {
  model: string
  feature: string
  user_initiated_interaction_count: number
  code_generation_activity_count: number
  code_acceptance_activity_count: number
  loc_suggested_to_add_sum: number
  loc_suggested_to_delete_sum: number
  loc_added_sum: number
  loc_deleted_sum: number
}

export interface TokenUsage {
  /** Sum of input/prompt tokens consumed. */
  prompt_tokens_sum: number
  /** Sum of output tokens generated. */
  output_tokens_sum: number
  avg_tokens_per_request?: number
}

export interface TotalsByCli {
  prompt_count?: number
  request_count?: number
  session_count?: number
  token_usage?: TokenUsage
  last_known_cli_version?: unknown
}

/** AI adoption cohort assigned by GitHub (when present in the export). */
export interface AiAdoptionPhase {
  phase_number: number
  phase: string
  version: string
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
  /** Official AI credits consumed that day (newer exports). */
  ai_credits_used?: number
  /** Top-level LOC aggregates (newer exports; preferred over nested IDE sums). */
  loc_suggested_to_add_sum?: number
  loc_suggested_to_delete_sum?: number
  loc_added_sum?: number
  loc_deleted_sum?: number
  ai_adoption_phase?: AiAdoptionPhase
  totals_by_ide: TotalsByIde[]
  totals_by_feature: TotalsByFeature[]
  totals_by_language_feature: TotalsByLanguageFeature[]
  totals_by_language_model?: TotalsByLanguageModel[]
  totals_by_model_feature?: TotalsByModelFeature[]
  totals_by_cli?: TotalsByCli
  totals_by_copilot_app?: TotalsByCli
  used_agent?: boolean
  used_chat?: boolean
  used_cli?: boolean
  used_copilot_coding_agent?: boolean
  used_copilot_cloud_agent?: boolean
  used_copilot_app?: boolean
  used_copilot_code_review_active?: boolean
  used_copilot_code_review_passive?: boolean
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
  /** Sum of official `ai_credits_used` (0 when absent from the export). */
  ai_credits: number
  /** Latest known adoption phase label for this user. */
  adoption_phase: string | null
  adoption_phase_number: number | null
}

export interface DailyMetrics {
  day: string
  active_users: number
  total_interactions: number
  total_code_generated: number
  total_code_accepted: number
  acceptance_rate: number
  /** Sum of official AI credits for the day. */
  ai_credits: number
  loc_added: number
  loc_suggested: number
}

export interface AdoptionPhaseMetrics {
  phase: string
  phase_number: number
  users: number
  ai_credits: number
  loc_added: number
  loc_suggested: number
  interactions: number
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
  /** LOC acceptance rate (added / suggested), 0–100. */
  loc_acceptance_rate: number
  total_ai_credits: number
  /** Cost in USD at $0.01 per AI credit. */
  total_ai_cost_usd: number
  /** True when at least one row carries official `ai_credits_used`. */
  has_official_ai_credits: boolean
}
