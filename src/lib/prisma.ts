import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/prisma/client';
// import { serializationMiddleware } from '../../prisma';
import { env } from 'env';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  const useAdapter = env.USE_ADAPTER === false;

  if (useAdapter) {
    neonConfig.poolQueryViaFetch = true;

    const connectionString = env.DATABASE_URL;

    // Add a check to ensure the DATABASE_URL is actually set
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined.');
    }

    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({
      adapter,
      log:
        env.NODE_ENV === 'development'
          ? [
              { emit: 'stdout', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    } as never);
  }

  return new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

/**
 * @initialize @param globalThis used during the development because of hot reloading in nextJS.
 * If we don't do that, it will always initialize a new PrismaClient
 * every time it reloads that we have too may active prisma clients.
 * In production, we always initialize it like this:
 * @param export const @var prisma = new @function PrismaClient()
 */
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// in order to avoid creating too many prisma instances in development.
if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export type * as SchemaTypes from '@prisma/client';
export { Prisma } from '@/prisma/client';
