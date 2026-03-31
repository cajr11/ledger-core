# Ledger Core API

NestJS API for the multi-currency payment ledger. Uses TigerBeetle for double-entry accounting, PostgreSQL for relational data, and Redis for caching and idempotency.

## Prerequisites

- Docker Desktop (for infrastructure services)
- Node.js 20+
- pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Start infrastructure (from repo root)
docker compose up -d

# Start API in watch mode
pnpm run start:dev
```

On startup, the API automatically seeds system accounts (FUNDING_SOURCE, INTERNAL_POOL, FEE_COLLECTION, OFF_RAMP) for all supported currencies.

## Database (Prisma)

Prisma CLI runs on your host machine, but the PostgreSQL database runs inside Docker. The Docker service name `db` is only resolvable inside the Docker network, so you must override `DATABASE_URL` with `localhost` when running Prisma commands locally.

### Running migrations

```bash
DATABASE_URL="postgresql://ledger:somepassword@localhost:5432/ledger_core" pnpm prisma-migrate <migration-name>
```

### Generating the Prisma client

```bash
pnpm prisma-generate
```

We run this after every migration in order to generate new types.

### Opening Prisma Studio

```bash
DATABASE_URL="postgresql://ledger:somepassword@localhost:5432/ledger_core" pnpm prisma-studio
```

Replace `ledger:somepassword` with your actual credentials from `.env`.

## Demo Script

Run the full end-to-end demo (API must be running):

```bash
./scripts/demo.sh
```

This creates test users, funds accounts, runs same-currency and cross-border transfers, and shows the transfer history with status transitions.

## API Endpoints

### Users

| Method | Route                  | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| POST   | /users                 | Create a user + wallet account       |
| GET    | /users/:id             | Get user by ID                       |
| GET    | /users/:id/accounts    | Get all accounts for a user          |
| GET    | /users/account/:id     | Get account balance from TigerBeetle |

### Transfers

| Method | Route                  | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| POST   | /transfers/create      | Create a transfer (same-currency or cross-border) |
| POST   | /transfers/fund        | Fund a user wallet from system funding account |
| GET    | /transfers/:id         | Get transfer by ID                   |
| GET    | /transfers/:id/history | Get full status history of a transfer |

### Quotes

| Method | Route                  | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| POST   | /quotes                | Get a transfer quote with locked exchange rate (30s TTL) |
| GET    | /quotes/:id            | Get a quote by ID                    |

### System Accounts

| Method | Route                        | Description                          |
| ------ | ---------------------------- | ------------------------------------ |
| POST   | /system-accounts/funding     | Create a funding account for a currency |
| GET    | /system-accounts             | Get all system accounts              |
| GET    | /system-accounts/:currency   | Get funding account by currency      |

### Webhooks

| Method | Route                  | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| POST   | /webhooks/provider     | Receive status updates from payment providers |

### Health

| Method | Route                  | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| GET    | /health                | Health check                         |

## Key Concepts

- **Same-currency transfers**: Instant, processed entirely in TigerBeetle. Carlos (MXN) -> Maria (MXN).
- **Cross-border transfers**: Async, provider-driven. Carlos (MXN) -> Kwame (GHS). Uses exchange rate quotes, fee deduction (1.5%), and webhook-based status updates.
- **Idempotency**: All transfer endpoints accept a client-generated `idempotencyKey`. Duplicate requests return the original transfer. Keys are cached in Redis for 24 hours.
- **Quotes**: Exchange rates are locked for 30 seconds via `POST /quotes`. Pass the `quoteId` when creating a cross-border transfer to use the locked rate.
- **System accounts**: Per-currency accounts for funding (on-ramp), pools (transit), fees, and off-ramp. Seeded automatically on startup.

## Swagger Docs

Available at `http://localhost:3000/docs` when the API is running.
