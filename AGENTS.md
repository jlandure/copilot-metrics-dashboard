# AGENTS.md - Instructions for AI Agents

This document provides instructions for AI agents working on this project.

## Project Overview

**Copilot Metrics Dashboard** is a Vue.js web application that visualizes GitHub Copilot usage metrics. It allows companies to analyze Copilot adoption, AI-credit consumption, and LOC productivity within their teams.

## Architecture

### Tech Stack

- **Frontend**: Vue.js 3.5 with Composition API (`<script setup>`)
- **Language**: TypeScript 5.9 (strict mode)
- **Build**: Vite 7.3
- **Charts**: Chart.js 4.5 via vue-chartjs
- **UI**: PrimeVue 4.5 + custom CSS
- **State**: Pinia 3.0
- **Routing**: Vue Router 4.6

### File Structure

```
copilot-metrics-dashboard/
├── src/
│   ├── components/                        # Vue components (Single File Components)
│   │   ├── aiusage/                       # AI-usage (credits & cost) view
│   │   │   ├── AiUsageCreditsCards.vue    # Included credits gauge + additional usage
│   │   │   └── AiUsageTrendChart.vue      # Daily cost chart (group by user; model for estimates)
│   │   ├── charts/                        # Encapsulated charts
│   │   │   ├── AdoptionPhaseChart.vue     # Users + credits by ai_adoption_phase
│   │   │   ├── FeatureDoughnutChart.vue
│   │   │   ├── IdeBarChart.vue
│   │   │   ├── LanguageBarChart.vue
│   │   │   ├── LocProductivityChart.vue   # LOC suggested vs added + acceptance %
│   │   │   └── UsageLineChart.vue         # modes: users | interactions | credits | loc
│   │   ├── FileUpload.vue
│   │   ├── StatsCards.vue
│   │   └── UsersTable.vue
│   ├── composables/                       # Reusable hooks (useXxx)
│   │   ├── useAiCreditsEstimate.ts        # Official ai_credits_used + fallback estimate
│   │   ├── useChartData.ts
│   │   ├── useCopilotMetrics.ts           # NDJSON parse + daily/user/adoption aggregations
│   │   └── useGithubBilling.ts            # Live GitHub Billing API client
│   ├── constants/
│   │   └── premiumModels.ts              # Model registry (AI-credit multipliers)
│   ├── types/                             # TypeScript definitions
│   │   ├── billing.ts                    # GitHub Billing API types
│   │   ├── copilot.ts                    # Copilot metrics + aggregations
│   │   └── premium.ts                    # Model registry types
│   ├── views/                             # Pages/Views
│   │   ├── BillingUsageView.vue           # /billing
│   │   ├── DashboardView.vue              # /
│   │   └── UserDetailView.vue             # /user/:userLogin
│   └── router/                            # Router configuration
├── public/                                # Static assets
└── dist/                                  # Production build
```

## Code Conventions

### UI Language

**All user-facing strings (labels, buttons, tooltips, error messages, table
headers, chart legends, etc.) MUST be written in English.** This includes:

- Component templates (`<template>` content)
- Tooltip and `title` attributes
- Toast / error / loading messages
- Empty states and placeholders
- Chart axis labels and dataset names
- Code comments may stay in any language, but UI text is always English

Reasoning: this dashboard is consumed by international audiences; UI consistency
matters more than dev convenience. Use `Intl.NumberFormat('en-US', ...)` and
`toLocaleDateString('en-US', ...)` for number/date formatting unless a specific
locale override is requested.

### Vue.js

- Use `<script setup lang="ts">` for all components
- Prefer Composition API over Options API
- Extract reusable logic into composables (`useXxx.ts`)
- Name files in PascalCase for Vue components
- Use typed props with `defineProps<T>()`

### TypeScript

- Always explicitly type props, function returns, and complex variables
- Define interfaces in `src/types/`
- Avoid `any`, prefer `unknown` if necessary
- Use Vue generic types (`Ref<T>`, `ComputedRef<T>`)

### CSS

- Use `<style scoped>` to isolate styles
- CSS variables defined in `src/assets/main.css`
- Prefix classes with component name or use BEM
- Dark theme by default with GitHub palette

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UsersTable.vue` |
| Composables | camelCase with `use` prefix | `useCopilotMetrics.ts` |
| Types/Interfaces | PascalCase | `UserSummary` |
| Variables/Functions | camelCase | `loadMetrics()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_USERS` |
| CSS Files | kebab-case | `main.css` |

## Data Model

### Main Types

Types are defined in `src/types/copilot.ts`:

- **`CopilotMetric`** — Raw day/user row. Newer exports include `ai_credits_used`,
  top-level `loc_*_sum`, `ai_adoption_phase`, and product flags
  (`used_cli`, `used_copilot_coding_agent`, …)
- **`UserSummary`** — Aggregation per user (+ `ai_credits`, `adoption_phase`, LOC)
- **`DailyMetrics`** — Aggregation per day (+ `ai_credits`, `loc_added`, `loc_suggested`)
- **`AdoptionPhaseMetrics`** — Users / credits / LOC per adoption cohort
- **`GlobalStats`** — Global KPIs including total AI credits/cost and LOC acceptance
- **`FeatureMetrics`** / `IdeMetrics` / `LanguageMetrics` — Metrics by dimension

Model registry types are defined in `src/types/premium.ts`:

- **`ModelMultiplier`** — A model entry with `current` / `new` multipliers and
  published token prices. The `new` value is the AI-credit multiplier used by
  the fallback estimation.

AI-usage row shapes are defined in `src/composables/useAiCreditsEstimate.ts`:

- **`AiCreditsUserRow`** — Per-user credits, cost, included/overage credits and
  per-model breakdown
- **`AiCreditsModelRow`** — Per-model interactions, credits and cost (estimated)
- **`AiCreditsTotals`** — Account totals (credits, cost, quota, overage, `isOfficial`)

### Input Data Format

The dashboard consumes **NDJSON** (Newline Delimited JSON) files. Each line is a JSON object representing a user's metrics for a given day.

## Common Tasks

### Adding a New Chart

1. Create the component in `src/components/charts/`
2. Import types from `@/types/copilot`
3. Use Chart.js via `vue-chartjs` (see existing charts for the dark-theme options pattern)
4. Define props with the data to display
5. Add the chart in `DashboardView.vue`

### Adding a New Composable

1. Create `src/composables/useFeatureName.ts`
2. Export a function that returns an object with reactive values
3. Use `ref()`, `computed()`, `watch()` from Vue
4. Document parameters and return values

### Adding a New Model to the Registry

1. Open `src/constants/premiumModels.ts`
2. Add an entry to `MODEL_REGISTRY` with `id`, `displayName`, `aliases` (lowercased), `current` multiplier, `new` (AI-credit) multiplier, and token prices
3. The alias index is rebuilt automatically at startup via `buildAliasIndex()`

### Modifying Global Styles

1. Edit `src/assets/main.css`
2. Use existing CSS variables (`--color-*`, `--radius-*`, etc.)
3. Test in dark mode

## AI Usage Feature (credits & cost)

### Overview

Since the usage-based pricing model (active June 1 2026), GitHub bills Copilot
in **AI credits** (1 AI credit = $0.01). Newer NDJSON exports include official
`ai_credits_used` per day/user. The dashboard prefers that field and falls back
to an interaction × multiplier estimate for older exports. There is no separate
premium-requests view anymore.

### Data flow

```
CopilotMetric (NDJSON)
  ├─ ai_credits_used, loc_*_sum, ai_adoption_phase
  └─ totals_by_model_feature (fallback estimate + model activity)
       ├─► useAiCreditsEstimate → cards, trend (by user), table
       └─► useCopilotMetrics → KPIs, dailyMetrics, adoptionMetrics
            ├─► AdoptionPhaseChart / LocProductivityChart
            └─► UsersTable / UserDetailView
```

Dashboard layout (three blocks):

1. **Overview** — `StatsCards` (users, credits, cost, LOC, interactions)
2. **AI usage & cost** — gauge + daily credits + trend by user
3. **Adoption & productivity** — phase chart + LOC trend + feature/IDE/language charts + users table

### Key concepts

| Concept | Description |
|---------|-------------|
| **Official AI credits** | `ai_credits_used` on each NDJSON row (source of truth when present) |
| **Fallback estimate** | `credits = interactions × MODEL_REGISTRY.new` for older exports |
| **Cost** | `cost = credits × $0.01` (`AI_CREDIT_USD`) |
| **Plan quota** | Monthly AI credits per user (`AI_CREDITS_PLANS`, Business/Enterprise, with promo) |
| **Included vs additional** | Credits within `userCount × creditsPerUser` are "included"; the rest is overage |
| **Adoption phase** | `ai_adoption_phase` cohort (Phase 1/2/3 / No Cohort) |
| **LOC top-level** | Prefer `loc_*_sum` on the row; fall back to summing nested IDE totals |
| **Group by** | Trend chart groups by user when official credits are present |

### Notes

- Official credits are not broken down by model; per-model cost remains an
  interaction-based estimate.
- Settings (plan, promo toggle, unknown multiplier) are module-level refs in
  `useAiCreditsEstimate`, so every component (cards, chart, table, user detail)
  stays in sync without prop drilling.
- The `/billing` route (`BillingUsageView` + `useGithubBilling`) talks to the
  GitHub Billing API via the Vite/Nginx `/api/github` proxy — separate from NDJSON.

## Docker and Deployment

### Docker Build

```bash
docker build -t copilot-metrics-dashboard .
docker run -p 8080:8080 copilot-metrics-dashboard
```

### Cloud Run

```bash
npm run deploy
```

- The `Dockerfile` uses a multi-stage build (Node.js → Nginx Alpine)
- Port is dynamic via `$PORT` (default: 8080)
- Nginx proxies `/api/github/*` to `api.github.com` for the Billing page
- User is non-root (`appuser:1001`)
- Health check configured for monitoring

## Important Considerations

### Performance

- Chart.js graphs can be heavy with lots of data
- Limit the number of displayed points (e.g., top 10 languages)
- Use `computed()` for derived calculations (automatic caching)

### Accessibility

- Add `aria-label` on interactive elements
- Ensure sufficient contrast (dark theme)
- Test keyboard navigation

### Security

- No sensitive data in the frontend
- Validate NDJSON format before parsing
- Escape displayed data
- Do not commit NDJSON exports with real user data

## Tests

*(To be implemented)*

To add tests:
- Use Vitest for unit tests
- Vue Test Utils for component tests
- Consider Playwright or Cypress for E2E tests

## Useful Resources

- [Vue.js 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [PrimeVue Components](https://primevue.org/)
- [GitHub Copilot Metrics API](https://docs.github.com/en/rest/copilot)
