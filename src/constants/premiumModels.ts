import type { CopilotPlan, ModelMultiplier } from '@/types/premium'

/**
 * Canonical registry of GitHub Copilot models and their premium-request
 * multipliers. Multipliers come from GitHub's published rate sheet and may
 * differ between the currently in-effect rate ("current") and the announced
 * upcoming rate ("new").
 *
 * Each entry includes a list of `aliases` matching the raw model strings that
 * appear in the Copilot Metrics NDJSON export, lowercased.
 */
export const MODEL_REGISTRY: ModelMultiplier[] = [
  {
    id: 'claude-haiku-4.5',
    displayName: 'Claude Haiku 4.5',
    aliases: ['claude-4.5-haiku', 'claude-haiku-4.5'],
    current: 0.33,
    new: 0.33
  },
  {
    id: 'claude-opus-4.5',
    displayName: 'Claude Opus 4.5',
    aliases: ['claude-opus-4.5', 'claude-4.5-opus'],
    current: 3,
    new: 15
  },
  {
    id: 'claude-opus-4.6',
    displayName: 'Claude Opus 4.6',
    aliases: ['claude-opus-4.6', 'claude-4.6-opus'],
    current: 3,
    new: 27
  },
  {
    id: 'claude-opus-4.7',
    displayName: 'Claude Opus 4.7',
    aliases: ['claude-opus-4.7', 'claude-4.7-opus'],
    current: 7.5,
    new: 27
  },
  {
    id: 'claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    aliases: ['claude-4.0-sonnet', 'claude-sonnet-4', 'claude-4-sonnet'],
    current: 1,
    new: 1
  },
  {
    id: 'claude-sonnet-4.5',
    displayName: 'Claude Sonnet 4.5',
    aliases: ['claude-4.5-sonnet', 'claude-sonnet-4.5'],
    current: 1,
    new: 6
  },
  {
    id: 'claude-sonnet-4.6',
    displayName: 'Claude Sonnet 4.6',
    aliases: ['claude-4.6-sonnet', 'claude-sonnet-4.6'],
    current: 1,
    new: 9
  },
  {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    aliases: ['gemini-2.5-pro'],
    current: 1,
    new: 1
  },
  {
    id: 'gemini-3-flash',
    displayName: 'Gemini 3 Flash',
    aliases: ['gemini-3-flash', 'gemini-3.0-flash'],
    current: 0.33,
    new: 0.33
  },
  {
    id: 'gemini-3-pro',
    displayName: 'Gemini 3 Pro',
    aliases: ['gemini-3-pro', 'gemini-3.0-pro'],
    current: 1,
    new: 6
  },
  {
    id: 'gemini-3.1-pro',
    displayName: 'Gemini 3.1 Pro',
    aliases: ['gemini-3.1-pro'],
    current: 1,
    new: 6
  },
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    aliases: ['gpt-4o'],
    current: 0,
    new: 0.33
  },
  {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    aliases: ['gpt-4o-mini'],
    current: 0,
    new: 0.33
  },
  {
    id: 'gpt-4.1',
    displayName: 'GPT-4.1',
    aliases: ['gpt-4.1'],
    current: 0,
    new: 1
  },
  {
    id: 'gpt-5',
    displayName: 'GPT-5',
    aliases: ['gpt-5.0', 'gpt-5'],
    current: 1,
    new: 1
  },
  {
    id: 'gpt-5.1',
    displayName: 'GPT-5.1',
    aliases: ['gpt-5.1'],
    current: 1,
    new: 3
  },
  {
    id: 'gpt-5.1-codex',
    displayName: 'GPT-5.1-Codex',
    aliases: ['gpt-5.1-codex'],
    current: 1,
    new: 3
  },
  {
    id: 'gpt-5.1-codex-mini',
    displayName: 'GPT-5.1-Codex-Mini',
    aliases: ['gpt-5.1-codex-mini'],
    current: 0.33,
    new: 0.33
  },
  {
    id: 'gpt-5.1-codex-max',
    displayName: 'GPT-5.1-Codex-Max',
    aliases: ['gpt-5.1-codex-max'],
    current: 1,
    new: 3
  },
  {
    id: 'gpt-5.2',
    displayName: 'GPT-5.2',
    aliases: ['gpt-5.2'],
    current: 1,
    new: 3
  },
  {
    id: 'gpt-5.2-codex',
    displayName: 'GPT-5.2-Codex',
    aliases: ['gpt-5.2-codex'],
    current: 1,
    new: 3
  },
  {
    id: 'gpt-5.3-codex',
    displayName: 'GPT-5.3-Codex',
    aliases: ['gpt-5.3-codex'],
    current: 1,
    new: 6
  },
  {
    id: 'gpt-5.4',
    displayName: 'GPT-5.4',
    aliases: ['gpt-5.4'],
    current: 1,
    new: 6
  },
  {
    id: 'gpt-5.4-mini',
    displayName: 'GPT-5.4 mini',
    aliases: ['gpt-5.4-mini'],
    current: 0.33,
    new: 6
  },
  {
    id: 'gpt-5-mini',
    displayName: 'GPT-5 mini',
    aliases: ['gpt-5-mini'],
    current: 0,
    new: 0.33
  },
  {
    id: 'grok-code-fast-1',
    displayName: 'Grok Code Fast 1',
    aliases: ['grok-code-fast-1'],
    current: 0.25,
    new: 0.33
  },
  {
    id: 'raptor-mini',
    displayName: 'Raptor mini',
    aliases: ['raptor-mini'],
    current: 0,
    new: 0.33
  }
]

/**
 * Synthetic registry entry used as a fallback for raw model names that don't
 * match any canonical entry (e.g. `auto`, `unknown`). Multiplier is editable
 * in settings via `unknownMultiplier`.
 */
export const UNKNOWN_MODEL_ID = '__unknown__'

export const COPILOT_PLANS: CopilotPlan[] = [
  { id: 'free', label: 'Copilot Free', monthlyQuota: 50 },
  { id: 'pro', label: 'Copilot Pro', monthlyQuota: 300 },
  { id: 'pro_plus', label: 'Copilot Pro+', monthlyQuota: 1500 },
  { id: 'business', label: 'Copilot Business', monthlyQuota: 300 },
  { id: 'enterprise', label: 'Copilot Enterprise', monthlyQuota: 1000 },
  { id: 'custom', label: 'Custom quota', monthlyQuota: 1000 }
]

export const DEFAULT_PLAN_ID = 'business'
export const DEFAULT_MULTIPLIER_VERSION = 'current'
export const DEFAULT_UNKNOWN_MULTIPLIER = 1
export const DEFAULT_PERIOD_MODE: 'all' | 'current_month' = 'all'

/** Build a lookup map: alias (lowercased) -> registry entry. */
export function buildAliasIndex(): Map<string, ModelMultiplier> {
  const map = new Map<string, ModelMultiplier>()
  for (const entry of MODEL_REGISTRY) {
    map.set(entry.id.toLowerCase(), entry)
    for (const alias of entry.aliases) {
      map.set(alias.toLowerCase(), entry)
    }
  }
  return map
}
