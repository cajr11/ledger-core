# Ledger Core Dashboard

Next.js dashboard for monitoring and managing the ledger. Connects to the Ledger Core API.

## Features

- Overview with transfer flow visualizer showing money movement between accounts
- User management with wallet balances
- Transfer list with status filtering and detail view
- Full status timeline showing every state transition
- System account balances across all currencies
- Activity feed with live polling
- Create users, fund accounts, and initiate transfers from the UI

## Getting Started

```bash
# Install dependencies (from repo root)
pnpm install

# Make sure the API is running
docker compose up -d

# Start the dashboard
cd web
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Environment

The dashboard needs the API URL. Set it in your `.env`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Shared types from `@ledger-core/shared`
