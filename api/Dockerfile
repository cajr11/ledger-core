FROM node:20.20-slim
WORKDIR /usr/local/ledger-core

RUN npm install -g pnpm@10.22.0

# Copy workspace config and all package.json files first for cache
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY api/package.json ./api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --filter ledger-core-api...

# Copy shared package source
COPY packages/shared ./packages/shared

# Copy API source
COPY api ./api

WORKDIR /usr/local/ledger-core/api

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]
