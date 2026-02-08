import 'dotenv/config';
import { PrismaClient, UserStatus } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });
const USERS_COUNT = 100;
const DEFAULT_PASSWORD_HASH = '$2b$10$abcdefghijklmnopqrstuv';
const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1504593811423-6dd665756598';

function buildUsers() {
  const now = new Date();

  return Array.from({ length: USERS_COUNT }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0');
    const name = `User ${suffix}`;

    return {
      name,
      username: `user${suffix}`,
      email: `seed.user.${suffix}@example.com`,
      password: DEFAULT_PASSWORD_HASH,
      status: UserStatus.ACTIVE,
      avatarUrl: DEFAULT_AVATAR_URL,
      avatarPublicId: null,
      emailVerifiedAt: now,
    };
  });
}

async function main() {
  await prisma.user.deleteMany();

  const usersData = buildUsers();
  await prisma.user.createMany({ data: usersData });

  console.log(`Seeded ${USERS_COUNT} users with default avatar.`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
