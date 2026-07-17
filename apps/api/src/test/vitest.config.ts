import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globalSetup: ['./src/test/global-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    env: {
      DATABASE_URL:
        'postgresql://hassad:hassad_dev_password@localhost:5432/hassad_e2e',
      JWT_SECRET: 'test-jwt-secret-for-e2e-tests',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-for-e2e-tests',
    },
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
