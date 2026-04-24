# Budget Tracker

A personal finance PWA for tracking expenses, income, bills, savings goals, debts, and multiple accounts — all offline, all client-side.

Built with React, TypeScript, and Tailwind CSS. No backend required.

## Features

- **Transactions** — Log income and expenses with categories, notes, and needs/wants tags
- **Accounts** — Manage debit and credit card accounts with transfers between them
- **Bills** — Track recurring bills with due dates and installment plans
- **Savings Goals** — Set targets, deadlines, and track contributions over time
- **Debts** — Monitor debts with interest rates, minimum payments, and payment history
- **Receivables** — Track money owed to you with due dates
- **Wishlist** — Save desired purchases with priority levels
- **Recurring Templates** — Quick-add from saved expense templates
- **Budget Limits** — Set and track spending limits per category
- **Analytics** — Visual breakdowns with charts and monthly reports
- **PIN Lock** — Optional security for app access
- **Dark / Light Theme** — Toggleable with smooth transitions
- **PWA** — Installable, works offline, mobile-optimized

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand (persisted to localStorage) |
| Charts | Recharts |
| PWA | Custom service worker + web manifest |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── features/           # Feature screens
│   ├── dashboard/      # Home dashboard
│   ├── transactions/   # Add/edit income & expenses
│   ├── summary/        # Transaction list & filters
│   ├── analytics/      # Charts & breakdowns
│   ├── report/         # Monthly reports
│   ├── bills/          # Bill management
│   ├── savings/        # Savings goals
│   ├── debts/          # Debt tracking
│   ├── receivables/    # Money owed to you
│   ├── wishlist/       # Shopping wishlist
│   ├── wallets/        # Account management
│   ├── recurring/      # Recurring templates
│   ├── settings/       # App settings
│   ├── security/       # PIN lock
│   └── pwa/            # Install prompt
├── shared/
│   ├── components/     # Reusable UI (Card, Input, Button, etc.)
│   ├── store/          # Zustand store
│   ├── types/          # TypeScript types
│   ├── hooks/          # Custom hooks
│   └── utils/          # Helpers (formatting, cycles, CSV export, etc.)
├── App.tsx             # App shell, navigation, bottom bar
├── main.tsx            # Entry point
└── index.css           # Tailwind config & design tokens
```

## License

MIT
