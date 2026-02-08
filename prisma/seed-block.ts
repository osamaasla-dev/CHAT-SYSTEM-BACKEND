import 'dotenv/config';
import { PrismaClient, UserStatus } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const PLAINTEXT_PASSWORD = 'a123456789A@';
const BCRYPT_ROUNDS = 10;
const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1504593811423-6dd665756598';

const BLOCKED_USERS_COUNT = 100;
const mainAccount = {
  username: 'master',
  email: 'elshabbah95@gmail.com',
  name: 'Block Master',
};

let cachedPasswordHash: string | null = null;

async function getPasswordHash() {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(PLAINTEXT_PASSWORD, BCRYPT_ROUNDS);
  }
  return cachedPasswordHash;
}

function buildBlockedUserMeta(index: number) {
  const suffix = String(index + 1).padStart(3, '0');
  return {
    name: `Blocked User ${suffix}`,
    username: `user${suffix}`,
    email: `blocked.user.${suffix}@example.com`,
  };
}

async function upsertMainAccount() {
  const now = new Date();
  const passwordHash = await getPasswordHash();

  return prisma.user.upsert({
    where: { username: mainAccount.username },
    update: {
      name: mainAccount.name,
      email: mainAccount.email,
      status: UserStatus.ACTIVE,
      password: passwordHash,
      avatarUrl: DEFAULT_AVATAR_URL,
      avatarPublicId: null,
      emailVerifiedAt: now,
    },
    create: {
      name: mainAccount.name,
      username: mainAccount.username,
      email: mainAccount.email,
      password: passwordHash,
      status: UserStatus.ACTIVE,
      avatarUrl: DEFAULT_AVATAR_URL,
      avatarPublicId: null,
      emailVerifiedAt: now,
    },
  });
}

async function upsertBlockedUsers() {
  const now = new Date();
  const passwordHash = await getPasswordHash();

  const users = Array.from({ length: BLOCKED_USERS_COUNT }, (_, index) =>
    buildBlockedUserMeta(index),
  );

  return Promise.all(
    users.map((meta) =>
      prisma.user.upsert({
        where: { username: meta.username },
        update: {
          name: meta.name,
          email: meta.email,
          status: UserStatus.ACTIVE,
          password: passwordHash,
          avatarUrl: DEFAULT_AVATAR_URL,
          avatarPublicId: null,
          emailVerifiedAt: now,
        },
        create: {
          name: meta.name,
          username: meta.username,
          email: meta.email,
          password: passwordHash,
          status: UserStatus.ACTIVE,
          avatarUrl: DEFAULT_AVATAR_URL,
          avatarPublicId: null,
          emailVerifiedAt: now,
        },
      }),
    ),
  );
}

async function main() {
  const mainUser = await upsertMainAccount();
  console.log(`Main user ready: ${mainUser.username} (${mainUser.id})`);

  const blockedUsers = await upsertBlockedUsers();
  console.log(`Ensured ${blockedUsers.length} blocked user accounts exist.`);

  await prisma.block.deleteMany({ where: { blockerId: mainUser.id } });

  await prisma.block.createMany({
    data: blockedUsers.map((user) => ({
      blockerId: mainUser.id,
      blockedId: user.id,
    })),
  });

  console.log(
    `Seeded ${blockedUsers.length} block records for ${mainUser.username}.`,
  );
}

main()
  .catch((error) => {
    console.error('Block seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
