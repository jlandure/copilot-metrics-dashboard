# 📊 GitHub Copilot Metrics Dashboard

> Visualization dashboard for GitHub Copilot usage metrics for enterprises.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

## ✨ Features

- **📈 Copilot Metrics Visualization** - Interactive charts to analyze adoption
- **👥 User Tracking** - Detailed view per user with individual statistics
- **🖥️ IDE Distribution** - Usage analysis by VS Code, IntelliJ, etc.
- **💬 Feature Metrics** - Chat, Agent, Completions
- **🌐 Top Languages** - Most used programming languages
- **📁 Data Import** - Load NDJSON files exported from GitHub

## 🖼️ Preview

The dashboard displays:

- **Global Stats Cards** - Active users, total interactions, acceptance rate
- **Time Series Charts** - Evolution of active users and daily activity
- **Distribution Charts** - Breakdown by feature and IDE
- **Users Table** - Complete list with individual metrics and navigation to details

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.19.0 or >= 22.12.0
- **npm** >= 10.x

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/utech-stats-github.git
cd utech-stats-github

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

## 🐳 Docker

### Local Build and Run

```bash
# Build the image
docker build -t copilot-metrics-dashboard .

# Run
docker run -p 8080:8080 copilot-metrics-dashboard
```

### Cloud Run Deployment

The Docker image is optimized for Google Cloud Run with:
- Multi-stage build for minimal image size
- Nginx Alpine as web server
- Dynamic port support via `$PORT`
- Built-in health checks
- Non-root user for security

## 📂 Project Structure

```
utech-stats-github/
├── src/
│   ├── components/          # Reusable Vue components
│   │   ├── charts/          # Chart.js charts
│   │   │   ├── FeatureDoughnutChart.vue
│   │   │   ├── IdeBarChart.vue
│   │   │   ├── LanguageBarChart.vue
│   │   │   └── UsageLineChart.vue
│   │   ├── FileUpload.vue   # NDJSON file upload
│   │   ├── StatsCards.vue   # Statistics cards
│   │   └── UsersTable.vue   # Users table
│   ├── composables/         # Reusable logic (Composition API)
│   │   ├── useChartData.ts  # Chart configuration
│   │   └── useCopilotMetrics.ts  # Metrics parsing and aggregation
│   ├── types/               # TypeScript types
│   │   └── copilot.ts       # Interfaces for Copilot metrics
│   ├── views/               # Application pages
│   │   ├── DashboardView.vue
│   │   └── UserDetailView.vue
│   ├── router/              # Vue Router configuration
│   ├── App.vue              # Root component
│   └── main.ts              # Entry point
├── public/
│   └── data/                # Demo data
├── Dockerfile               # Multi-stage Docker image
├── nginx.conf               # Nginx configuration
└── package.json
```

## 📊 Data Format

The dashboard accepts **NDJSON** (Newline Delimited JSON) files exported from the GitHub Copilot Metrics API. Each line represents a user's metrics for a day:

```json
{
  "day": "2025-01-15",
  "user_login": "john.doe",
  "user_id": 12345,
  "user_initiated_interaction_count": 42,
  "code_generation_activity_count": 156,
  "code_acceptance_activity_count": 89,
  "totals_by_ide": [...],
  "totals_by_feature": [...],
  "totals_by_language_feature": [...]
}
```

## 🛠️ Tech Stack

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

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build with TypeScript checking |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript type checking |
| `npm run build-only` | Build without type checking |

## 🎨 Theme

The interface uses a GitHub-inspired dark theme with:
- GitHub color palette (blue, green, orange, red)
- Responsive design
- Subtle animations
- Custom SVG icons

## 📝 License

MIT License - See the [LICENSE](LICENSE) file for more details.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or pull request.

---

Built with ❤️ for GitHub Copilot metrics analysis
