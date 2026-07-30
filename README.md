# GitHub Copilot Metrics Dashboard

> Visualization dashboard for GitHub Copilot usage metrics for enterprises.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

## Features

- **Copilot Metrics Visualization** — Interactive charts to analyze adoption
- **AI Credits & Cost** — Official `ai_credits_used` from the NDJSON export (with fallback estimate for older files)
- **Adoption Phases** — Cohort breakdown (Phase 1/2/3 / No Cohort) with credits intensity
- **LOC Productivity** — Suggested vs added lines of code over time
- **User Tracking** — Detailed view per user with credits, phase, and individual statistics
- **IDE / Feature / Language** — Usage breakdowns by IDE, feature, and language
- **Billing Usage Page** — Optional live pull from the GitHub Billing API (`/billing`)
- **Data Import** — Load NDJSON files exported from GitHub

## Preview

The dashboard displays:

- **Global Stats Cards** — Active users, AI credits, cost, LOC added/acceptance, interactions
- **AI Usage Section** — Included credits gauge, additional usage, daily credits, cost trend by user
- **Adoption & Productivity** — Adoption-by-phase chart and LOC productivity trend
- **Time Series Charts** — Active users and daily activity
- **Distribution Charts** — Breakdown by feature and IDE
- **Users Table** — Per-user activity, adoption phase, LOC, AI credits and cost
- **Billing Usage** — Live org/enterprise/user usage from GitHub Billing (separate route)

## Quick Start

### Prerequisites

- **Node.js** >= 20.19.0 or >= 22.12.0
- **npm** >= 10.x

### Installation

```bash
# Clone the repository
git clone https://github.com/jlandure/copilot-metrics-dashboard.git
cd copilot-metrics-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

## Docker

### Local Build and Run

```bash
# Build the image
docker build -t copilot-metrics-dashboard .

# Run
docker run -p 8080:8080 copilot-metrics-dashboard
```

### Cloud Run Deployment

```bash
npm run deploy
```

This runs `gcloud run deploy` against project `jlandure-demos` (region `europe-west1`).

The Docker image is optimized for Google Cloud Run with:

- Multi-stage build for minimal image size
- Nginx Alpine as web server (with `/api/github` proxy for Billing)
- Dynamic port support via `$PORT`
- Built-in health checks
- Non-root user for security

## Project Structure

```
copilot-metrics-dashboard/
├── src/
│   ├── components/
│   │   ├── aiusage/
│   │   │   ├── AiUsageCreditsCards.vue    # Included credits + additional usage
│   │   │   └── AiUsageTrendChart.vue      # Daily cost trend (by user/model)
│   │   ├── charts/
│   │   │   ├── AdoptionPhaseChart.vue     # Users + credits by adoption phase
│   │   │   ├── FeatureDoughnutChart.vue
│   │   │   ├── IdeBarChart.vue
│   │   │   ├── LanguageBarChart.vue
│   │   │   ├── LocProductivityChart.vue   # LOC suggested vs added
│   │   │   └── UsageLineChart.vue         # Users / interactions / credits modes
│   │   ├── FileUpload.vue
│   │   ├── StatsCards.vue
│   │   └── UsersTable.vue
│   ├── composables/
│   │   ├── useAiCreditsEstimate.ts        # Official credits + fallback estimate
│   │   ├── useChartData.ts
│   │   ├── useCopilotMetrics.ts           # NDJSON parse + aggregations
│   │   └── useGithubBilling.ts            # Live GitHub Billing API
│   ├── constants/
│   │   └── premiumModels.ts               # Model registry (AI-credit multipliers)
│   ├── types/
│   │   ├── billing.ts
│   │   ├── copilot.ts
│   │   └── premium.ts
│   ├── views/
│   │   ├── BillingUsageView.vue           # /billing
│   │   ├── DashboardView.vue
│   │   └── UserDetailView.vue
│   ├── router/
│   ├── App.vue
│   └── main.ts
├── Dockerfile
├── nginx.conf
└── package.json
```

## Data Format

The dashboard accepts **NDJSON** (Newline Delimited JSON) files exported from the GitHub Copilot Metrics API. Each line represents a user's metrics for a day.

Newer exports include official AI credits, top-level LOC, and adoption phase:

```json
{
  "day": "2026-07-15",
  "user_login": "john.doe",
  "user_id": 12345,
  "user_initiated_interaction_count": 42,
  "code_generation_activity_count": 156,
  "code_acceptance_activity_count": 89,
  "ai_credits_used": 1848.93,
  "loc_added_sum": 130,
  "loc_suggested_to_add_sum": 200,
  "ai_adoption_phase": {
    "phase_number": 1,
    "phase": "Phase 1",
    "version": "v1"
  },
  "totals_by_ide": [],
  "totals_by_feature": [],
  "totals_by_language_feature": [],
  "totals_by_model_feature": []
}
```

## AI Credits & Cost

Since the usage-based pricing model (active June 1 2026), GitHub bills Copilot in **AI credits** (1 AI credit = $0.01).

### How it works

1. Load your NDJSON file.
2. When `ai_credits_used` is present, the dashboard uses it as the source of truth for totals, trends, and per-user cost.
3. For older exports without that field, credits are estimated as `interactions × model multiplier` from `totals_by_model_feature` and `MODEL_REGISTRY`.
4. Choose your **Copilot plan** (Business / Enterprise) and optional promo quota to compare against the included allowance.
5. Official credits are **not** broken down by model — per-model rows remain interaction-based estimates.

### Plan quotas

| Plan | Standard credits / user / month | Promo (Jun–Sep 2026) |
|------|--------------------------------:|---------------------:|
| Copilot Business | 1 900 | 3 000 |
| Copilot Enterprise | 3 900 | 7 000 |

## Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| Vue.js | 3.5 | Reactive JavaScript framework |
| TypeScript | 5.9 | Static typing |
| Vite | 7.3 | Ultra-fast build tool |
| Chart.js | 4.5 | Charting library |
| vue-chartjs | 5.3 | Vue wrapper for Chart.js |
| PrimeVue | 4.5 | UI components |
| Pinia | 3.0 | State management |
| Vue Router | 4.6 | SPA routing |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build with TypeScript checking |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript type checking |
| `npm run build-only` | Build without type checking |
| `npm run deploy` | Deploy to Cloud Run (`europe-west1`) |

## Theme

The interface uses a GitHub-inspired dark theme with:

- GitHub color palette (blue, green, orange, red)
- Responsive design
- Subtle animations
- Custom SVG icons

## License

MIT License - See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! Feel free to open an issue or pull request.

---

Built with care for GitHub Copilot metrics analysis
