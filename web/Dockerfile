FROM node:20.20-alpine

WORKDIR /usr/local/ledger-core/web

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .

RUN npm install -g pnpm@10.22.0

RUN pnpm install

COPY . .

EXPOSE 3001

CMD ["pnpm", "run", "dev"]