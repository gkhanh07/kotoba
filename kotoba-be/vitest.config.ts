import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'src/**/*.spec.ts'],
      reporter: ['text', 'text-summary'],
      // Baseline of the unit suite measured in phase 13.5, rounded down
      // (AGENTS.md §10). Raise only, never lower. Gap to 90%: BACKLOG.md.
      thresholds: { statements: 26, branches: 34, functions: 33, lines: 25 },
    },
  },
});
