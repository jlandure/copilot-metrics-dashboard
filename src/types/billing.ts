/**
 * Types for GitHub's Enhanced Billing Platform "AI credit usage" REST API.
 *
 * Unlike the NDJSON metrics export (interaction counts only), this endpoint
 * returns the *actual billed* AI-credit quantities and dollar amounts, broken
 * down by model. See:
 *   GET /organizations/{org}/settings/billing/ai_credit/usage
 *   GET /enterprises/{enterprise}/settings/billing/ai_credit/usage
 *   GET /users/{username}/settings/billing/ai_credit/usage
 *
 * Docs: https://docs.github.com/en/rest/billing/usage
 */

/** Which billing account the report is scoped to. */
export type BillingScope = 'organization' | 'enterprise' | 'user'

/** A single line of the AI-credit usage report (one product/sku/model combo). */
export interface AiCreditUsageItem {
  product: string
  sku: string
  model: string
  unitType: string
  pricePerUnit: number
  /** Total AI credits consumed before discounts. */
  grossQuantity: number
  /** Gross dollar amount (USD). */
  grossAmount: number
  discountQuantity: number
  discountAmount: number
  /** AI credits billed after discounts. */
  netQuantity: number
  /** Net dollar amount billed (USD). */
  netAmount: number
}

export interface BillingTimePeriod {
  year: number
  month?: number
  day?: number
  organization?: string
  user?: string
  product?: string
  model?: string
}

/** Raw response of the AI-credit usage endpoint. */
export interface AiCreditUsageResponse {
  timePeriod: BillingTimePeriod
  usageItems: AiCreditUsageItem[]
}

/** Per-model rollup computed from the raw usage items. */
export interface BillingModelRow {
  model: string
  product: string
  /** AI credits billed (net of discounts). */
  netCredits: number
  /** AI credits before discounts. */
  grossCredits: number
  /** Net dollar amount billed (USD). */
  netAmount: number
  /** Gross dollar amount (USD). */
  grossAmount: number
  discountAmount: number
}

/** Account-level totals computed from the raw usage items. */
export interface BillingTotals {
  modelCount: number
  grossCredits: number
  netCredits: number
  grossAmount: number
  netAmount: number
  discountAmount: number
}
