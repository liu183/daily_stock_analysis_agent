import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma database client for Supabase PostgreSQL on Vercel.
 * Uses DSA_POSTGRES_PRISMA_URL (pooled) for runtime queries
 * and DSA_POSTGRES_URL_NON_POOLING for migrations.
 */
function createPrismaClient() {
  const databaseUrl = process.env.DSA_POSTGRES_PRISMA_URL
    || process.env.DATABASE_URL
    || 'file:./dev.db';

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  });
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
