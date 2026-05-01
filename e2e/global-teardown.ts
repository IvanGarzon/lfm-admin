/**
 * Playwright Global Teardown
 *
 * Removes the entire E2E environment (tenant + all data) created by global-setup
 * so the database is clean after every test run.
 */

import { execSync } from 'child_process';

export default async function globalTeardown() {
  execSync('pnpm tsx --env-file=.env prisma/seeds/teardown-e2e-environment.ts', {
    stdio: 'inherit'
  });
}
