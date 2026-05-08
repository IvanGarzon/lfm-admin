import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/prisma/client';
import { env } from '@/env';
import { logger } from '@/lib/logger';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  neonConfig.poolQueryViaFetch = true;
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  const adapter = new PrismaNeon({ connectionString });
  const client = new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' }
          ]
        : [{ emit: 'stdout', level: 'error' }]
  });

  // Add query performance monitoring in development
  if (env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      const duration = e.duration;
      const query = e.query;
      const params = e.params;

      // Warn about slow queries (> 1 second)
      if (duration > 1000) {
        logger.warn('Slow query detected', {
          context: 'PrismaQueryMonitor',
          metadata: {
            query,
            params,
            duration: `${duration}ms`,
            timestamp: e.timestamp
          }
        });
      }

      logger.debug('Prisma query', {
        context: 'PrismaQueryMonitor',
        metadata: {
          duration: `${duration}ms`,
          query: `${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`,
          ...(params && params !== '[]' ? { params } : {})
        }
      });
    });
  }

  return client;
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
