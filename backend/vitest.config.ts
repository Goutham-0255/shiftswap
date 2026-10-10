import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: { NODE_ENV: 'test', DATABASE_URL: 'file:./test.db' },
    globalSetup: './tests/setup.ts',
    fileParallelism: false,
  },
});
