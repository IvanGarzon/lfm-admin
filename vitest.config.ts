import path from 'path';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    silent: false,
    globals: true,
    environment: 'node',
    // environment: 'happy-dom',
    // environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    deps: {
      interopDefault: true,
    },
    testTimeout: 10000,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.cjs'],
    alias: {
      '@/env': path.resolve(__dirname, 'env.ts'),
      '@/prisma/client': path.resolve(__dirname, 'src/testing/mocks/prisma.ts'),
      '@/prisma': path.resolve(__dirname, 'prisma/generated'),
      '@/zod': path.resolve(__dirname, 'prisma/zod'),
      '@/repo': path.resolve(__dirname, 'prisma/prisma-vault'),
      '@': path.resolve(__dirname, 'src'),
      '@prisma': path.resolve(__dirname, 'prisma'),
    },
  },
});
