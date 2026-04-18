import path from 'path';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vitest config for integration tests.
 *
 * Key differences from vitest.config.ts:
 * - @/prisma/client resolves to the REAL generated client (not the mock)
 * - No global mock for @/lib/prisma — tests use getTestPrisma() instead
 * - Test files match *.integration.ts pattern to avoid running with unit tests
 * - Longer timeout to accommodate container startup and DB operations
 * - Single worker to avoid port conflicts between containers
 */
export default defineConfig({
  test: {
    silent: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.ts'],
    setupFiles: ['./src/lib/testing/integration/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    pool: 'forks',
    maxWorkers: 1,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.cjs'],
    alias: {
      '@/env': path.resolve(__dirname, 'env.ts'),
      // Real Prisma client — NOT the mock
      '@/prisma/client': path.resolve(__dirname, 'prisma/generated/client'),
      '@/prisma': path.resolve(__dirname, 'prisma/generated'),
      '@/zod': path.resolve(__dirname, 'prisma/zod'),
      '@/repo': path.resolve(__dirname, 'prisma/prisma-vault'),
      '@': path.resolve(__dirname, 'src'),
      // audit.service.ts imports env as a bare specifier (not @/env)
      env: path.resolve(__dirname, 'env.ts'),
    },
  },
});
