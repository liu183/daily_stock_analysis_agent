# Daily Stock Analysis Agent

A full-stack AI-powered stock analysis application built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui. Features include AI-driven stock analysis, portfolio management, strategy backtesting, and intelligent chat.

## Features

### Home Dashboard
- **Stock Search** — Search and select stocks with real-time autocomplete
- **AI Analysis** — One-click comprehensive analysis with score gauge, trend badges, key metrics, price levels, risk alerts, and news sentiment
- **Analysis History** — Browse and review past analyses with trend indicators and relative timestamps
- **Task Management** — Real-time task progress tracking with status indicators

### Portfolio Management
- **Multi-Account Support** — Manage multiple brokerage accounts (CN/HK/US markets)
- **Trade Recording** — Record buy/sell trades with fees, taxes, and notes
- **Position Tracking** — Real-time positions with FIFO/AVG cost basis calculation
- **Holdings Distribution** — Interactive donut pie chart of portfolio allocation
- **Cash Ledger** — Track deposits, withdrawals, and cash balance
- **P&L Dashboard** — Color-coded profit/loss display

### Backtest
- **AI Prediction Validation** — Compare AI predictions against actual price movements
- **Performance Metrics** — Direction accuracy, win rate, avg return, stop-loss/take-profit rates
- **Per-Stock Breakdown** — Drill down into individual stock prediction accuracy
- **Filterable Results** — Filter by stock code, date range, evaluation window, and status

### AI Chat (问股)
- **9 Analysis Strategies** — General analysis, Moving Average Crossover, Chan Theory, Elliott Wave, Multi-Trend, Box Consolidation, Sentiment Cycle, Bottom Volume, Volume Pullback
- **Real-time Market Data** — Auto-injected stock quotes and historical data into conversations
- **Markdown Rendering** — Rich formatted responses with tables, code blocks, and syntax highlighting
- **Thinking Steps** — Visualize AI reasoning process step by step
- **Session Management** — Multiple chat sessions with history
- **Export** — Download conversations as Markdown files

### Settings
- **6 Configuration Categories** — Base settings, AI Model, Data Source, Notifications, Analysis Config, System
- **Validation** — Inline validation for all config values
- **Auto-Initialization** — Missing settings auto-created from defaults

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM (SQLite) |
| State | Zustand (client), TanStack Query (server) |
| Charts | Recharts |
| AI | z-ai-web-dev-sdk (LLM) |
| Icons | Lucide React |
| Animations | Framer Motion |

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/liu183/daily_stock_analysis_agent.git
cd daily_stock_analysis_agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analysis/        # Stock analysis endpoints
│   │   ├── backtest/        # Backtest endpoints
│   │   ├── chat/            # AI chat endpoints
│   │   ├── portfolio/       # Portfolio management endpoints
│   │   ├── settings/        # Settings endpoints
│   │   ├── stocks/          # Stock search/quote endpoints
│   │   └── tasks/           # Task management endpoints
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main page with tab routing
│   └── globals.css          # Global styles
├── components/
│   ├── backtest/            # Backtest components
│   ├── chat/                # Chat components
│   ├── home/                # Dashboard components
│   ├── layout/              # App shell, theme
│   ├── portfolio/           # Portfolio components
│   ├── settings/            # Settings components
│   └── ui/                  # shadcn/ui components
├── hooks/                   # Custom hooks
├── lib/                     # Utilities, DB, API helpers
├── stores/                  # Zustand state stores
└── types/                   # TypeScript type definitions
```

## Deployment on Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/liu183/daily_stock_analysis_agent&project-name=daily-stock-analysis-agent&repository-name=daily-stock-analysis-agent)

### Option 2: Manual Deploy

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Configure environment variables:
   - `DATABASE_URL` — Use Turso or PlanetScale for production
4. Deploy

### Database for Production

SQLite is used in development. For Vercel production deployment, consider:

- **[Turso](https://turso.tech)** — SQLite-compatible edge database
- **[PlanetScale](https://planetscale.com)** — MySQL-compatible
- **[Supabase](https://supabase.com)** — PostgreSQL

To switch to Turso:
```prisma
// prisma/schema.prisma
datasource db {
  provider  = "sqlite"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Add for Turso
}
```

## License

MIT
