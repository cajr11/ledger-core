FROM node:20.20-alpine
WORKDIR /usr/local/ledger-core/api

COPY package.json pnpm-lock.yaml .

RUN npm install -g pnpm@10.22.0

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]



