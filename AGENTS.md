# AGENTS.md - Instructions for AI Agents

This document provides instructions for AI agents working on this project.

## 📋 Project Overview

**Copilot Metrics Dashboard** is a Vue.js web application that visualizes GitHub Copilot usage metrics. It allows companies to analyze Copilot adoption and effectiveness within their teams.

## 🏗️ Architecture

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
│   │   ├── charts/                        # Encapsulated charts
│   │   ├── PremiumRequestsCard.vue        # Per-user premium requests card
│   │   ├── PremiumSettingsDialog.vue      # Plan & multiplier settings dialog
│   │   └── PremiumTopConsumersCard.vue    # Dashboard top consumers card
│   ├── composables/                       # Reusable hooks (useXxx)
│   │   ├── usePremiumRequests.ts          # Premium request usage computation
│   │   └── usePremiumSettings.ts          # Plan & multiplier settings (localStorage)
│   ├── constants/
│   │   └── premiumModels.ts              # Model registry with multipliers & plan quotas
│   ├── types/                             # TypeScript definitions
│   │   ├── copilot.ts                    # Copilot metrics interfaces
│   │   └── premium.ts                    # Premium request types
│   ├── views/                             # Pages/Views
│   └── router/                            # Router configuration
├── public/                                # Static assets
└── dist/                                  # Production build
```

## 🎯 Code Conventions

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

## 📊 Data Model

### Main Types

Types are defined in `src/types/copilot.ts`:

- **`CopilotMetric`** - Raw data for one day per user (includes `totals_by_model_feature`)
- **`UserSummary`** - Aggregation per user
- **`DailyMetrics`** - Aggregation per day
- **`GlobalStats`** - Global statistics
- **`FeatureMetrics`** / `IdeMetrics` / `LanguageMetrics` - Metrics by dimension

Premium types are defined in `src/types/premium.ts`:

- **`ModelMultiplier`** - A model entry with `current` and `new` multipliers
- **`PremiumSettings`** - Plan, multiplier version, period mode and per-model overrides
- **`UserPremiumUsage`** - Aggregated premium request usage for one user
- **`PremiumModelUsage`** - Per-model breakdown (interactions × multiplier)
- **`PremiumTier`** / `PremiumTierId` - Quota consumption tiers (0–30%, 30–60%, …, +100%)

### Input Data Format

The dashboard consumes **NDJSON** (Newline Delimited JSON) files. Each line is a JSON object representing a user's metrics for a given day.

## 🔧 Common Tasks

### Adding a New Chart

1. Create the component in `src/components/charts/`
2. Import types from `@/types/copilot`
3. Use `useChartData()` for Chart.js configuration
4. Define props with the data to display
5. Add the chart in `DashboardView.vue`

### Adding a New Composable

1. Create `src/composables/useFeatureName.ts`
2. Export a function that returns an object with reactive values
3. Use `ref()`, `computed()`, `watch()` from Vue
4. Document parameters and return values

### Adding a New Model to the Premium Registry

1. Open `src/constants/premiumModels.ts`
2. Add an entry to `MODEL_REGISTRY` with `id`, `displayName`, `aliases` (lowercased), `current` multiplier, and `new` multiplier
3. The alias index is rebuilt automatically at startup via `buildAliasIndex()`

### Modifying Global Styles

1. Edit `src/assets/main.css`
2. Use existing CSS variables (`--color-*`, `--radius-*`, etc.)
3. Test in dark mode

## 💎 Premium Requests Feature

### Overview

The premium requests feature estimates how many GitHub Copilot **premium requests** each user consumes, based on their per-model interaction counts from the NDJSON data.

### Data flow

```
CopilotMetric.totals_by_model_feature
  └─► usePremiumRequests (aggregates by user & model)
        ├─► MODEL_REGISTRY + alias index (maps raw model name → multiplier)
        ├─► usePremiumSettings (plan quota, multiplier version, period mode, overrides)
        └─► UserPremiumUsage[] (sorted by premium_requests desc)
              ├─► PremiumTopConsumersCard  (dashboard view)
              ├─► PremiumRequestsCard      (user detail view)
              └─► PremiumDistributionChart (tier doughnut chart)
```

### Key concepts

| Concept | Description |
|---------|-------------|
| **Multiplier** | Factor applied to interactions to get premium requests (`interactions × multiplier`) |
| **Period mode** | `all` = use all loaded data, project to 30 days; `current_month` = filter to current calendar month, project to end of month |
| **Plan quota** | Monthly premium request allowance per user (varies by Copilot plan) |
| **Overrides** | Per-model user-defined multipliers stored in `localStorage`, taking priority over registry defaults |
| **Unknown model** | Any model not in `MODEL_REGISTRY` (e.g. `auto`) is grouped and assigned a configurable fallback multiplier |

### Settings persistence

`usePremiumSettings` stores all settings in `localStorage` under key `copilot-premium-settings-v1`. Settings merge on load so new fields added to `defaultSettings()` are picked up without breaking existing data.

## 🐳 Docker and Deployment

### Docker Build

```bash
docker build -t copilot-metrics-dashboard .
docker run -p 8080:8080 copilot-metrics-dashboard
```

### Cloud Run Specifics

- The `Dockerfile` uses a multi-stage build (Node.js → Nginx Alpine)
- Port is dynamic via `$PORT` (default: 8080)
- User is non-root (`appuser:1001`)
- Health check configured for monitoring

## ⚠️ Important Considerations

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

## 🧪 Tests

*(To be implemented)*

To add tests:
- Use Vitest for unit tests
- Vue Test Utils for component tests
- Consider Playwright or Cypress for E2E tests

## 📚 Useful Resources

- [Vue.js 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [PrimeVue Components](https://primevue.org/)
- [GitHub Copilot Metrics API](https://docs.github.com/en/rest/copilot)
