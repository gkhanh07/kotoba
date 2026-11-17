import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: './test/global-setup.ts',
    env: { DATABASE_URL: 'file:./test.db', APP_URL: 'http://localhost:3000' },
    fileParallelism: false,
  },
});
