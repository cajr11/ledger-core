# Ledger Core API

NestJS API for the multi-currency payment ledger. Uses TigerBeetle for double-entry accounting and PostgreSQL for relational data.

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

We run this after every migration in oorder to generate new types.

### Opening Prisma Studio

```bash
DATABASE_URL="postgresql://ledger:somepassword@localhost:5432/ledger_core" pnpm prisma-studio
```

Replace `ledger:somepassword` with your actual credentials from `.env`.

## API Endpoints

| Method | Route               | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | /health             | Health check                         |
| POST   | /users              | Create a user + wallet account       |
| GET    | /users/:id          | Get user by ID                       |
| GET    | /users/:id/accounts | Get all accounts for a user          |
| GET    | /users/account/:id  | Get account balance from TigerBeetle |
