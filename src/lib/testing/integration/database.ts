/**
 * Integration Test Database Harness
 *
 * Spins up a real Postgres container via Testcontainers, runs all Prisma
 * migrations, and provides a PrismaClient connected to it.
 *
 * Usage in a test file:
 *
 * ```ts
 * import { setupTestDatabaseLifecycle, getTestPrisma } from '@/lib/testing/integration/database';
 *
 * setupTestDatabaseLifecycle();
 *
 * describe('MyRepository', () => {
 *   it('does something', async () => {
 *     const prisma = getTestPrisma();
 *     // ...
 *   });
 * });
 * ```
 */

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';

let container: StartedPostgreSqlContainer | undefined;
let prismaInstance: PrismaClient | undefined;

// -- Helpers ---------------------------------------------------------------

function getProjectRoot(): string {
  const cwd = process.env.PNPM_SCRIPT_CWD ?? process.cwd();
  return cwd;
}

// -- Setup / teardown ------------------------------------------------------

/**
 * Start a Postgres container and run all Prisma migrations.
 * Returns the connection string, a ready PrismaClient, and the container.
 */
export async function setupTestDatabase(): Promise<{
  connectionString: string;
  prisma: PrismaClient;
  container: StartedPostgreSqlContainer;
}> {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('lfm_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const connectionString = container.getConnectionUri();

  execSync('pnpm prisma migrate deploy', {
    cwd: getProjectRoot(),
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'pipe',
  });

  prismaInstance = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  return { connectionString, prisma: prismaInstance, container };
}

/**
 * Disconnect PrismaClient and stop the container.
 */
export async function teardownTestDatabase(): Promise<void> {
  await prismaInstance?.$disconnect();
  await container?.stop();
  prismaInstance = undefined;
  container = undefined;
}

/**
 * Get the shared PrismaClient for the current test run.
 * Throws if setupTestDatabase() has not been called.
 */
export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    throw new Error(
      'Test database not initialised. Call setupTestDatabase() in beforeAll, or use setupTestDatabaseLifecycle().',
    );
  }
  return prismaInstance;
}

// -- Table truncation ------------------------------------------------------

/**
 * Truncate all application tables in the public schema, preserving
 * _prisma_migrations. Uses CASCADE to handle foreign key constraints.
 */
export async function truncateAllTables(): Promise<void> {
  const db = getTestPrisma();

  const tables = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const tableNames = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);
}

// -- Lifecycle helper ------------------------------------------------------

/**
 * Wire up beforeAll / afterAll / beforeEach for integration tests.
 * The container is started once per file and tables are truncated before each test.
 *
 * @param options.beforeEach - Optional async hook to seed data before each test.
 *
 * @example
 * setupTestDatabaseLifecycle({
 *   beforeEach: async () => {
 *     const prisma = getTestPrisma();
 *     await prisma.tenant.create({ data: { ... } });
 *   },
 * });
 */
export function setupTestDatabaseLifecycle(
  options: { beforeEach?: () => Promise<void> } = {},
): void {
  beforeAll(async () => {
    await setupTestDatabase();
  }, 120_000); // allow up to 2 min for image pull on first run

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await truncateAllTables();
    await options.beforeEach?.();
  });
}

// -- Tenant seed helper ----------------------------------------------------

/**
 * Create a minimal tenant record for scoping test data.
 * Returns the tenant ID and slug for use in repository calls.
 */
export async function createTestTenant(
  overrides: { name?: string; slug?: string } = {},
): Promise<{ id: string; slug: string }> {
  const db = getTestPrisma();
  const name = overrides.name ?? 'Test Tenant';
  const slug = overrides.slug ?? `test-tenant-${Date.now()}`;

  const tenant = await db.tenant.create({
    data: { name, slug },
    select: { id: true, slug: true },
  });

  return tenant;
}
