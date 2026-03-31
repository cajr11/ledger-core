/**
 * Seed script for test data.
 *
 * This only seeds Postgres directly (users without wallets).
 * For full setup including TigerBeetle wallets, use the demo script
 * which calls the API endpoints.
 *
 * Run: DATABASE_URL="postgresql://ledger:somepassword@localhost:5432/ledger_core" npx tsx prisma/seed.ts
 */

import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

const TEST_USERS = [
  { email: 'carlos@test.com', fullName: 'Carlos Martinez', country: 'MX' },
  { email: 'maria@test.com', fullName: 'Maria Lopez', country: 'MX' },
  { email: 'ana@test.com', fullName: 'Ana Rodriguez', country: 'CO' },
  { email: 'kwame@test.com', fullName: 'Kwame Asante', country: 'GH' },
  { email: 'jorge@test.com', fullName: 'Jorge Perez', country: 'NG' },
];

async function main() {
  console.log('Seeding test users...\n');

  for (const user of TEST_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`  [skip] ${user.email} already exists`);
      continue;
    }

    const created = await prisma.user.create({ data: user });
    console.log(`  [created] ${user.fullName} (${user.country}) - ${created.id}`);
  }

  console.log('\nDone. Note: These users do not have wallets yet.');
  console.log('Use the demo script (scripts/demo.sh) to create users with wallets via the API.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
