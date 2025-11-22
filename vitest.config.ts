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
      '@': path.resolve(__dirname, 'src'),
      '@prisma': path.resolve(__dirname, 'prisma'),
    },
  },
});
