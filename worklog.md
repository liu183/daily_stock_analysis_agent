# DSA - Daily Stock Analysis — Worklog

## Task 2: Home/Dashboard Page with Stock Search, Analysis, and History

**Date**: 2026-04-25
**Status**: Completed

### Summary
Built the complete Home/Dashboard page for the DSA stock analysis application, including all required components, API routes, TypeScript types, Zustand state management, and AI-powered analysis integration.

### Files Created

#### TypeScript Types
- `src/types/stock.ts` — Core type definitions for `StockQuote`, `StockSearchResult`, `AnalysisReport`, `ReportJson`, `HistoryItem`, `AnalysisTask`

#### Zustand Store
- `src/stores/analysis-store.ts` — State management with `query`, `isAnalyzing`, `currentReport`, `historyItems`, `selectedHistoryId`, `error`, `activeTasks` and actions: `submitAnalysis()`, `loadHistory()`, `selectReport()`, `pollTasks()`

#### UI Components
- `src/components/home/stock-search.tsx` — Stock search with autocomplete dropdown using cmdk/Command, debounced API calls to finance search endpoint, stock selection and submit
- `src/components/home/analysis-report.tsx` — Comprehensive analysis report card with score gauge (SVG ring), trend badges (green/yellow/red), key metrics grid, recharts sparkline, moving averages, price levels (support/resistance), collapsible risk alerts & positive catalysts, news sentiment, and full detailed report rendering
- `src/components/home/history-panel.tsx` — Scrollable history list with trend icons, score badges, relative time formatting, and click-to-select
- `src/components/home/task-panel.tsx` — Active tasks display with status icons, progress bars, and status badges

#### API Routes
- `src/app/api/stocks/search/route.ts` — GET proxy to finance API search endpoint
- `src/app/api/stocks/quote/route.ts` — GET proxy to finance API quote endpoint
- `src/app/api/analysis/route.ts` — GET list history / POST create stub analysis
- `src/app/api/analysis/[id]/route.ts` — GET single analysis / DELETE analysis
- `src/app/api/analysis/analyze/route.ts` — POST triggers full AI analysis: fetches quote + historical + financial data from finance API, builds comprehensive prompt, calls z-ai-web-dev-sdk LLM, parses structured JSON response, saves to Prisma DB
- `src/app/api/tasks/route.ts` — GET active tasks / POST create task

#### Main Page
- `src/app/page.tsx` — Dashboard with Home/History tabs, integrated within the existing AppShell layout with sidebar navigation

### Architecture Decisions
1. **AppShell Integration**: Page content renders within the existing AppShell sidebar layout (no duplicate header/footer)
2. **Task Polling**: Auto-polls tasks every 2 seconds, auto-stops after 5 minutes to prevent unnecessary load
3. **Debounced Search**: 300ms debounce on stock search input to avoid excessive API calls
4. **Finance API Proxy**: All finance API calls go through Next.js API routes with the required `X-Z-AI-From: Z` header
5. **LLM Integration**: Analysis uses z-ai-web-dev-sdk's chat completions with a structured JSON prompt and robust JSON extraction (handles code fences, embedded objects)

### Verification
- ESLint passes with 0 errors, 0 warnings
- Dev server running successfully on port 3000
- All API routes returning 200 responses
- Database queries executing correctly (confirmed via dev.log)

---

## Task 4: Portfolio (持仓管理) Feature

**Date**: 2026-04-25
**Status**: Completed

### Summary
Built the complete Portfolio management feature for the DSA stock analysis application, including account management, trade recording, position calculation with FIFO/AVG cost methods, real-time price fetching, cash ledger management, and a holdings distribution pie chart.

### Files Created

#### TypeScript Types
- `src/types/portfolio.ts` — Type definitions for `PortfolioAccount`, `PortfolioPosition`, `PortfolioTrade`, `PortfolioCashEntry`, `PortfolioSnapshot`, `PortfolioRisk`, `CreateAccountInput`, `CreateTradeInput`, `CreateCashInput`

#### API Routes
- `src/app/api/portfolio/accounts/route.ts` — GET list all accounts (with trade/cash counts), POST create new account
- `src/app/api/portfolio/accounts/[id]/route.ts` — DELETE account (cascades trades, cash ledger, corporate actions)
- `src/app/api/portfolio/trades/route.ts` — GET list trades (with filters: accountId, symbol, side, dateFrom, dateTo, pagination), POST create trade
- `src/app/api/portfolio/trades/[id]/route.ts` — DELETE single trade
- `src/app/api/portfolio/snapshot/route.ts` — GET portfolio snapshot: calculates positions using FIFO or AVG cost method, fetches real-time stock prices from finance API, computes market values, unrealized P&L, and returns a full snapshot with positions sorted by market value
- `src/app/api/portfolio/cash/route.ts` — GET list cash ledger entries, POST create cash entry (deposit/withdraw)

#### UI Components
- `src/components/portfolio/portfolio-view.tsx` — Main portfolio view with: account selector dropdown, cost method toggle (FIFO/AVG), summary cards (Total Equity, Total Market Value, Total Cash, P&L), and sub-tabs for Positions, Trades, Cash Ledger, Corporate Actions. Includes inline components for trades history (with filter, pagination, delete) and cash ledger (with add form, balance calculation)
- `src/components/portfolio/positions-table.tsx` — Position details table with account, symbol, quantity, avg cost, current price, market value, and color-coded unrealized P&L (emerald for profit, red for loss)
- `src/components/portfolio/holdings-pie-chart.tsx` — Donut pie chart showing position distribution using recharts, with custom tooltip and legend. Merges positions under 3% into "其他". Uses emerald/teal/amber/orange color palette
- `src/components/portfolio/trade-form.tsx` — Slide-out sheet form to add manual trades: account selector, buy/sell toggle, symbol, date, quantity, price, fee, tax, note
- `src/components/portfolio/account-create-dialog.tsx` — Dialog to create new account: name, broker, market (cn/hk/us), base currency (CNY/HKD/USD)

#### Main Page Update
- `src/app/page.tsx` — Added tab-based routing: when `?tab=portfolio` is present in URL, renders `PortfolioView` instead of `HomeTab`

### Architecture Decisions
1. **Cost Method Calculation**: Implemented both FIFO and Average Cost (AVG) methods in the snapshot API. FIFO maintains a lot queue per symbol, AVG tracks running totals. Both handle sells correctly.
2. **Real-time Price Fetching**: Snapshot API fetches current prices from the finance API (`/v1/markets/quote`) with 5-minute caching (`next.revalidate: 300`). Batches concurrent requests (max 5 parallel) to avoid overwhelming the API.
3. **Cash Ledger**: Simple in/out ledger model. Total cash is calculated as sum of deposits minus withdrawals. Currency tracked per entry.
4. **Position Calculation on Backend**: All position calculations happen server-side in the snapshot API route, ensuring consistent cost basis logic and enabling price fetching.
5. **Responsive Design**: Summary cards in 2×2 grid on mobile, 4-column on desktop. Positions table and pie chart in 2:1 layout on large screens, stacked on mobile.
6. **Color Coding**: Emerald/green for profits, red for losses throughout (P&L values, buy/sell badges, cash in/out indicators).
7. **Cascading Deletes**: Deleting an account automatically removes all associated trades, cash ledger entries, and corporate actions.

### Verification
- ESLint passes with 0 errors, 0 warnings
- Dev server running successfully on port 3000
- Database schema is in sync
- All 7 API routes created and functional
- Tab routing (`?tab=portfolio`) correctly renders PortfolioView

---

## Task 5: Backtest (策略回测) & Settings (系统设置) Pages

**Date**: 2026-04-25
**Status**: Completed

### Summary
Built the Backtest and Settings pages for the DSA stock analysis application. The Backtest page enables running AI prediction backtests against actual stock price movements, with performance metrics, per-stock breakdowns, and filterable results table. The Settings page provides a category-based configuration management interface with validation, persistence to database, and reset/save functionality.

### Files Created

#### TypeScript Types
- `src/types/backtest.ts` — Type definitions for `BacktestResultItem`, `PerformanceMetrics`, `BacktestRunResponse`
- `src/types/settings.ts` — Type definitions for `SystemConfigItem`, `ConfigCategory`, `CONFIG_CATEGORY_LABELS`, `CONFIG_CATEGORIES`

#### Default Configuration
- `src/lib/default-config.ts` — All default config definitions with `ConfigDef` interface, organized by category (base, ai_model, data_source, notification, analysis, system). Includes helpers `getConfigDefsByCategory()` and `getAllConfigKeys()`. Covers 12 config keys: STOCK_LIST, REPORT_LANGUAGE, LITELLM_MODEL, LLM_TEMPERATURE, ENABLE_REALTIME_QUOTE, REALTIME_SOURCE_PRIORITY, BIAS_THRESHOLD, NEWS_MAX_AGE_DAYS, ENABLE_CHIP_DISTRIBUTION, ENABLE_NOTIFICATION, MAX_WORKERS, SCHEDULE_TIME

#### API Routes
- `src/app/api/backtest/route.ts` — GET backtest results with filters (stockCode, startDate, endDate, status, evalWindowDays) and pagination (page, pageSize). Returns paginated result items with total count and page info
- `src/app/api/backtest/run/route.ts` — POST triggers backtest evaluation: fetches analyses with no existing backtest results (or force rerun), uses finance API to get historical price data, calculates actual returns and direction correctness, determines outcome (win/loss/neutral), upserts BacktestResult records. Returns summary (processed, saved, completed, insufficient, errors)
- `src/app/api/backtest/performance/route.ts` — GET computes overall performance metrics (direction accuracy, win rate, avg return, stop loss/take profit rates) and per-stock performance breakdowns from completed BacktestResult records
- `src/app/api/settings/route.ts` — GET all settings grouped by category (auto-creates missing entries from DEFAULT_CONFIG), POST save batch settings updates via upsert
- `src/app/api/settings/validate/route.ts` — POST validates a single config value against rules (number ranges, select options, HH:MM format, stock list limits). Returns { valid, issues }

#### Backtest UI Components
- `src/components/backtest/performance-card.tsx` — Two cards: `PerformanceCard` for overall metrics (direction accuracy, win rate, avg sim/stock return, stop loss/take profit rates, win/loss/neutral counts with color-coded boxes), `StockPerformanceCard` for per-stock performance. Includes loading skeleton and empty states
- `src/components/backtest/results-table.tsx` — Backtest results table using shadcn Table with columns: Stock (name + code), Analysis Date, AI Prediction (trend badges), Actual Return (color-coded), Direction Match (✓/✗), Outcome (WIN=green, LOSS=red, NEUTRAL=yellow badges), Status badges. Scrollable with max height
- `src/components/backtest/backtest-view.tsx` — Full backtest view with filter bar (stock code, date range, eval window days, force rerun toggle, filter button), run backtest button, left sidebar (overall performance + per-stock cards), main results table with pagination, run result banner

#### Settings UI Components
- `src/components/settings/settings-field.tsx` — Individual settings field component with dynamic input rendering: text input, number input, select dropdown, toggle switch, password with show/hide toggle. Shows label, description, validation issues
- `src/components/settings/settings-category-nav.tsx` — Category navigation sidebar with 6 categories (基础设置, AI 模型, 数据源, 通知渠道, 分析配置, 系统), each with icon, active state highlighting, and issue count badges
- `src/components/settings/settings-view.tsx` — Full settings view with category sidebar, settings fields grouped by active category, save/reset buttons, inline validation before save, success notification, unsaved changes detection

#### Main Page Update
- `src/app/page.tsx` — Added `BacktestView` rendering for `?tab=backtest` and `SettingsView` rendering for `?tab=settings`. Home page logic extracted into `HomePage` component

### Architecture Decisions
1. **Backtest Evaluation Engine**: Server-side evaluation fetches historical price data from finance API, aligns candles to analysis dates, computes N-day forward returns, determines direction correctness by comparing predicted trend (bullish→up, bearish→down) with actual movement (±1% threshold)
2. **Performance Aggregation**: Performance metrics computed on-the-fly from BacktestResult records. Per-stock breakdown enables drill-down into individual stock accuracy
3. **Config Auto-Initialization**: Settings GET endpoint auto-creates missing SystemConfig entries from DEFAULT_CONFIG definitions using Prisma upsert, ensuring all keys always exist in the database
4. **Validation Pipeline**: Settings validation runs per-field before batch save. If any field has issues, the save is blocked and issues are displayed inline. Validates number ranges, select options, time format, and stock list limits
5. **Responsive Layout**: Backtest uses 4:8 grid (performance sidebar : results table). Settings uses 3:9 grid (category nav : settings fields). Both stack vertically on mobile
6. **Pagination**: Backtest results support server-side pagination with configurable page size (max 100)
7. **Emerald/Green Theme**: Consistent with the app's color scheme — emerald for positive metrics, red for negative, amber for neutral/warning

### Verification
- ESLint passes with 0 errors, 0 warnings
- Dev server running successfully on port 3000
- `/api/backtest` returns paginated results (empty initially)
- `/api/settings` returns all 12 config items grouped by 6 categories with defaults initialized
- `/api/backtest/performance` returns metrics structure
- Tab routing (`?tab=backtest`, `?tab=settings`) correctly renders respective views

---

## Task 3: AI Chat (问股) Feature

**Date**: 2026-04-25
**Status**: Completed

### Summary
Built the AI Chat (问股) feature for the DSA stock analysis application — a conversational interface where users can ask stock questions and receive AI-powered analysis with real-time market data context. Includes session management, strategy-specific analysis, markdown rendering, thinking process visualization, and markdown export.

### Files Created

#### Zustand Store
- `src/stores/chat-store.ts` — Chat state management with `ChatMessage`, `ChatSession`, `ThinkingStep` interfaces. Actions: `loadSessions()`, `startNewChat()`, `switchSession()`, `sendMessage()`, `deleteSession()`, `loadSessionMessages()`. Handles optimistic UI updates with loading states and error handling.

#### Helper Library
- `src/lib/stock-data-context.ts` — Stock data context extraction and formatting. `extractStockCodes()` detects A-share codes (600xxx, 000xxx, 300xxx), HK stocks (hk00700), US tickers from chat messages. `buildStockContext()` fetches real-time quote and historical data from finance API. `extractStockName()` detects Chinese stock names.

#### API Routes
- `src/app/api/chat/route.ts` — GET list chat sessions (sorted by updatedAt, max 50), POST create new session
- `src/app/api/chat/[sessionId]/route.ts` — DELETE session (cascade-deletes messages)
- `src/app/api/chat/[sessionId]/messages/route.ts` — GET session messages ordered by createdAt
- `src/app/api/chat/send/route.ts` — POST main chat endpoint: saves user message, loads conversation history, fetches stock data context via `buildStockContext()`, calls LLM with strategy-aware system prompt, saves assistant response with thinking steps, updates session message count
- `src/app/api/chat/[sessionId]/export/route.ts` — GET exports session as downloadable markdown file with metadata, formatted messages, and risk disclaimer

#### UI Components
- `src/components/chat/chat-view.tsx` — Main chat layout with left session sidebar (hidden on mobile) and right message thread. Empty state with 3 quick question buttons and strategy pills. Auto-scroll to bottom, loading indicator with step-by-step progress, error display, export button
- `src/components/chat/session-list.tsx` — Session sidebar with new chat button, scrollable session list showing title/message count/relative time. Active session highlighting, delete with AlertDialog confirmation
- `src/components/chat/chat-input.tsx` — Input area with auto-resizing textarea, Enter to send / Shift+Enter for newline, strategy selector (9 strategies: 通用分析, 均线金叉, 缠论, 波浪理论, 多头趋势, 箱体震荡, 情绪周期, 底部放量, 缩量回调) as expandable radio pill buttons, emerald-themed send button, disabled during loading
- `src/components/chat/message-bubble.tsx` — Message display: user messages right-aligned in emerald bubble, assistant messages left-aligned with Sparkles avatar. Markdown rendering via react-markdown + remark-gfm with custom styled components (tables, blockquotes, code, headers). Copy button on hover, collapsible thinking steps with step icons

#### Main Page Update
- `src/app/page.tsx` — Added `ChatView` rendering for `?tab=chat`, imported from `@/components/chat/chat-view`

### Architecture Decisions
1. **Strategy-Aware System Prompt**: The LLM system prompt is in Chinese, instructing the AI as a stock analysis expert. When a strategy is selected (e.g., 缠论, 波浪理论), additional strategy-specific instructions are appended to guide the analysis approach
2. **Real-time Stock Data Injection**: The send API route extracts stock codes from user messages, fetches quote + 10-day historical data, and injects it as context into the LLM prompt. This gives the AI actual market data to reference in its analysis
3. **Thinking Steps Visualization**: Each AI response includes structured thinking steps (analyze question → fetch data → generate report) with duration tracking, displayed as collapsible steps in the UI
4. **Session-based Conversation History**: Full conversation context is sent to the LLM on each message, enabling multi-turn dialogue. History is loaded from DB when switching sessions
5. **Markdown Export**: Sessions can be exported as formatted markdown files with session metadata, user/assistant message separation, and mandatory risk disclaimer
6. **Emerald Color Theme**: Consistent green theme throughout — emerald send button, user message bubbles, AI avatar, strategy pills, copy feedback
7. **Separate Messages Route**: Next.js App Router requires a separate `route.ts` at `[sessionId]/messages/` for the `/api/chat/[sessionId]/messages` endpoint

### LLM Integration Details
- Uses `z-ai-web-dev-sdk` for chat completions with `thinking: { type: 'disabled' }`
- System prompt requires: trend judgment, key price levels, buy/sell/hold recommendation, risk warning, markdown formatting
- 9 analysis strategies with specialized prompts for each approach
- Stock context automatically appended to user messages when stock codes are detected

### Verification
- ESLint passes with 0 errors, 0 warnings
- Dev server running successfully on port 3000
- Chat page (`?tab=chat`) renders correctly with empty state
- API routes tested: session CRUD, message loading, export
- Tab routing (`?tab=chat`) correctly renders ChatView
