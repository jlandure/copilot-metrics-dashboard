import type { ModelMultiplier } from '@/types/premium'

/**
 * Canonical registry of GitHub Copilot models.
 *
 * `current` / `new` — premium-request multipliers (pre-June 2026 billing).
 * `inputPricePer1M` / `outputPricePer1M` — USD per 1 million tokens
 *   (GitHub's published rates for the usage-based billing model, June 2026+).
 *   Source: https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing
 *   0 = effectively free / included (e.g. code completions).
 */
export const MODEL_REGISTRY: ModelMultiplier[] = [
  // ── Anthropic Claude ───────────────────────────────────────────────────────
  {
    id: 'claude-haiku-4.5',
    displayName: 'Claude Haiku 4.5',
    aliases: ['claude-4.5-haiku', 'claude-haiku-4.5'],
    current: 0.33,
    new: 0.33,
    inputPricePer1M: 0.80,
    outputPricePer1M: 4.00
  },
  {
    id: 'claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    aliases: ['claude-4.0-sonnet', 'claude-sonnet-4', 'claude-4-sonnet'],
    current: 1,
    new: 1,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'claude-sonnet-4.5',
    displayName: 'Claude Sonnet 4.5',
    aliases: ['claude-4.5-sonnet', 'claude-sonnet-4.5'],
    current: 1,
    new: 6,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'claude-sonnet-4.6',
    displayName: 'Claude Sonnet 4.6',
    aliases: ['claude-4.6-sonnet', 'claude-sonnet-4.6'],
    current: 1,
    new: 9,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'claude-opus-4.5',
    displayName: 'Claude Opus 4.5',
    aliases: ['claude-opus-4.5', 'claude-4.5-opus'],
    current: 3,
    new: 15,
    inputPricePer1M: 15.00,
    outputPricePer1M: 75.00
  },
  {
    id: 'claude-opus-4.6',
    displayName: 'Claude Opus 4.6',
    aliases: ['claude-opus-4.6', 'claude-4.6-opus'],
    current: 3,
    new: 27,
    inputPricePer1M: 15.00,
    outputPricePer1M: 75.00
  },
  {
    id: 'claude-opus-4.7',
    displayName: 'Claude Opus 4.7',
    aliases: ['claude-opus-4.7', 'claude-4.7-opus'],
    current: 7.5,
    new: 27,
    inputPricePer1M: 15.00,
    outputPricePer1M: 75.00
  },
  // ── Google Gemini ──────────────────────────────────────────────────────────
  {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    aliases: ['gemini-2.5-pro'],
    current: 1,
    new: 1,
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.00
  },
  {
    id: 'gemini-3-flash',
    displayName: 'Gemini 3 Flash',
    aliases: ['gemini-3-flash', 'gemini-3.0-flash'],
    current: 0.33,
    new: 0.33,
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60
  },
  {
    id: 'gemini-3-pro',
    displayName: 'Gemini 3 Pro',
    aliases: ['gemini-3-pro', 'gemini-3.0-pro'],
    current: 1,
    new: 6,
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.00
  },
  {
    id: 'gemini-3.1-pro',
    displayName: 'Gemini 3.1 Pro',
    aliases: ['gemini-3.1-pro'],
    current: 1,
    new: 6,
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.00
  },
  // ── OpenAI GPT ────────────────────────────────────────────────────────────
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    aliases: ['gpt-4o'],
    current: 0,
    new: 0.33,
    inputPricePer1M: 2.50,
    outputPricePer1M: 10.00
  },
  {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    aliases: ['gpt-4o-mini'],
    current: 0,
    new: 0.33,
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60
  },
  {
    id: 'gpt-4.1',
    displayName: 'GPT-4.1',
    aliases: ['gpt-4.1'],
    current: 0,
    new: 1,
    inputPricePer1M: 2.00,
    outputPricePer1M: 8.00
  },
  {
    id: 'gpt-5',
    displayName: 'GPT-5',
    aliases: ['gpt-5.0', 'gpt-5'],
    current: 1,
    new: 1,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'gpt-5-mini',
    displayName: 'GPT-5 mini',
    aliases: ['gpt-5-mini'],
    current: 0,
    new: 0.33,
    inputPricePer1M: 0.40,
    outputPricePer1M: 1.60
  },
  {
    id: 'gpt-5.1',
    displayName: 'GPT-5.1',
    aliases: ['gpt-5.1'],
    current: 1,
    new: 3,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'gpt-5.1-codex',
    displayName: 'GPT-5.1-Codex',
    aliases: ['gpt-5.1-codex'],
    current: 1,
    new: 3,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'gpt-5.1-codex-mini',
    displayName: 'GPT-5.1-Codex-Mini',
    aliases: ['gpt-5.1-codex-mini'],
    current: 0.33,
    new: 0.33,
    inputPricePer1M: 0.40,
    outputPricePer1M: 1.60
  },
  {
    id: 'gpt-5.1-codex-max',
    displayName: 'GPT-5.1-Codex-Max',
    aliases: ['gpt-5.1-codex-max'],
    current: 1,
    new: 3,
    inputPricePer1M: 5.00,
    outputPricePer1M: 20.00
  },
  {
    id: 'gpt-5.2',
    displayName: 'GPT-5.2',
    aliases: ['gpt-5.2'],
    current: 1,
    new: 3,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'gpt-5.2-codex',
    displayName: 'GPT-5.2-Codex',
    aliases: ['gpt-5.2-codex'],
    current: 1,
    new: 3,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  {
    id: 'gpt-5.3-codex',
    displayName: 'GPT-5.3-Codex',
    aliases: ['gpt-5.3-codex'],
    current: 1,
    new: 6,
    inputPricePer1M: 5.00,
    outputPricePer1M: 20.00
  },
  {
    id: 'gpt-5.4',
    displayName: 'GPT-5.4',
    aliases: ['gpt-5.4'],
    current: 1,
    new: 6,
    inputPricePer1M: 7.50,
    outputPricePer1M: 30.00
  },
  {
    id: 'gpt-5.4-mini',
    displayName: 'GPT-5.4 mini',
    aliases: ['gpt-5.4-mini'],
    current: 0.33,
    new: 6,
    inputPricePer1M: 1.10,
    outputPricePer1M: 4.40
  },
  // ── xAI Grok ──────────────────────────────────────────────────────────────
  {
    id: 'grok-code-fast-1',
    displayName: 'Grok Code Fast 1',
    aliases: ['grok-code-fast-1'],
    current: 0.25,
    new: 0.33,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  // ── Fine-tuned / GitHub models ────────────────────────────────────────────
  {
    id: 'raptor-mini',
    displayName: 'Raptor mini',
    aliases: ['raptor-mini'],
    current: 0,
    new: 0.33,
    inputPricePer1M: 0.40,
    outputPricePer1M: 1.60
  }
]

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
