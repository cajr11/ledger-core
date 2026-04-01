FROM node:20.20-alpine
WORKDIR /usr/local/ledger-core

RUN npm install -g pnpm@10.22.0

# Copy workspace config and all package.json files first for cache
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY web/package.json ./web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --filter web...

# Copy shared package source
COPY packages/shared ./packages/shared

# Copy web source
COPY web ./web

WORKDIR /usr/local/ledger-core/web

EXPOSE 3001

CMD ["pnpm", "run", "dev"]
