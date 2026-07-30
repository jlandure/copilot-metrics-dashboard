// Types for the GitHub Copilot model registry (AI-credit cost estimation).

export interface ModelMultiplier {
  /** Canonical model id, used as key. */
  id: string
  /** Human-readable display name. */
  displayName: string
  /** Aliases that may appear in raw NDJSON data (lowercased). */
  aliases: string[]
  /** Premium-request multiplier previously in effect at GitHub. */
  current: number
  /**
   * AI-credit multiplier under the usage-based pricing model (June 2026+):
   * credits = interactions × `new`.
   */
  new: number
  /**
   * GitHub's published input/prompt token price, USD per 1 million tokens.
   * 0 = free / included (e.g. code completions).
   */
  inputPricePer1M: number
  /** GitHub's published output token price, USD per 1 million tokens. */
  outputPricePer1M: number
}
