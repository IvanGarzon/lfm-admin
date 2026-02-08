/**
 * Database Query Analyzer
 * Tools for analyzing and optimizing database queries
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Query performance thresholds
 */
export const QUERY_THRESHOLDS = {
  SLOW: 1000, // 1 second
  MODERATE: 100, // 100ms
  FAST: 50, // 50ms
} as const;

/**
 * Analyze a query's performance
 */
export function analyzeQueryPerformance(duration: number): {
  level: 'fast' | 'moderate' | 'slow';
  color: string;
  recommendation?: string;
} {
  if (duration >= QUERY_THRESHOLDS.SLOW) {
    return {
      level: 'slow',
      color: '\x1b[31m', // Red
      recommendation:
        'Consider adding indexes, optimizing joins, or implementing caching for this query.',
    };
  }

  if (duration >= QUERY_THRESHOLDS.MODERATE) {
    return {
      level: 'moderate',
      color: '\x1b[33m', // Yellow
      recommendation: 'Monitor this query. Consider optimization if it runs frequently.',
    };
  }

  return {
    level: 'fast',
    color: '\x1b[32m', // Green
  };
}

/**
 * Get query statistics from Prisma
 * Useful for development and debugging
 */
export async function getQueryMetrics() {
  try {
    // Get database statistics
    const result = await prisma.$queryRaw<
      Array<{
        query: string;
        calls: bigint;
        total_time: number;
        mean_time: number;
      }>
    >`
      SELECT
        query,
        calls,
        total_time,
        mean_time
      FROM pg_stat_statements
      ORDER BY total_time DESC
      LIMIT 10;
    `;

    return result;
  } catch (error) {
    logger.error('Failed to fetch query metrics', error as Error, {
      context: 'getQueryMetrics',
    });
    return [];
  }
}

/**
 * Explain a query plan
 * Helps understand how Postgres will execute a query
 */
export async function explainQuery(query: string, params?: unknown[]): Promise<string | null> {
  try {
    const explainQuery = `EXPLAIN ANALYZE ${query}`;
    const result = await prisma.$queryRawUnsafe(explainQuery, ...(params || []));

    return JSON.stringify(result, null, 2);
  } catch (error) {
    logger.error('Failed to explain query', error as Error, {
      context: 'explainQuery',
      metadata: { query },
    });
    return null;
  }
}

/**
 * Check for missing indexes
 * Identifies tables that might benefit from indexes
 */
export async function checkMissingIndexes() {
  try {
    const result = await prisma.$queryRaw<
      Array<{
        tablename: string;
        seq_scan: bigint;
        idx_scan: bigint | null;
        ratio: number | null;
      }>
    >`
      SELECT
        schemaname || '.' || tablename AS tablename,
        seq_scan,
        idx_scan,
        CASE
          WHEN seq_scan > 0 THEN
            ROUND((idx_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
          ELSE NULL
        END AS ratio
      FROM pg_stat_user_tables
      WHERE seq_scan > 100
      ORDER BY seq_scan DESC
      LIMIT 10;
    `;

    return result;
  } catch (error) {
    logger.error('Failed to check missing indexes', error as Error, {
      context: 'checkMissingIndexes',
    });
    return [];
  }
}

/**
 * Get table sizes
 * Helps identify large tables that might need optimization
 */
export async function getTableSizes() {
  try {
    const result = await prisma.$queryRaw<
      Array<{
        table_name: string;
        total_size: string;
        table_size: string;
        indexes_size: string;
      }>
    >`
      SELECT
        table_name,
        pg_size_pretty(total_bytes) AS total_size,
        pg_size_pretty(table_bytes) AS table_size,
        pg_size_pretty(index_bytes) AS indexes_size
      FROM (
        SELECT
          table_name,
          pg_total_relation_size(table_name::regclass) AS total_bytes,
          pg_relation_size(table_name::regclass) AS table_bytes,
          pg_indexes_size(table_name::regclass) AS index_bytes
        FROM information_schema.tables
        WHERE table_schema = 'public'
      ) AS sizes
      ORDER BY total_bytes DESC
      LIMIT 10;
    `;

    return result;
  } catch (error) {
    logger.error('Failed to get table sizes', error as Error, {
      context: 'getTableSizes',
    });
    return [];
  }
}

/**
 * Get connection pool stats
 */
export function getConnectionStats() {
  // Note: Connection pool stats are environment-specific
  // This is a placeholder for tracking connection usage
  return {
    timestamp: new Date().toISOString(),
    note: 'Connection pooling is managed by Neon serverless adapter',
  };
}

/**
 * Performance monitoring summary
 * Call this periodically in development to get insights
 */
export async function getPerformanceSummary() {
  const [queryMetrics, missingIndexes, tableSizes] = await Promise.all([
    getQueryMetrics(),
    checkMissingIndexes(),
    getTableSizes(),
  ]);

  return {
    slowQueries: queryMetrics,
    potentialMissingIndexes: missingIndexes,
    largestTables: tableSizes,
    connectionStats: getConnectionStats(),
    timestamp: new Date().toISOString(),
  };
}
