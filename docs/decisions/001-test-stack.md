# ADR 001: Test stack for kotoba-fe (Vitest, React Testing Library, Playwright, axe)

- Status: accepted
- Date: 2026-11-03

## Context
AGENTS.md §7 requires unit tests with coverage, component tests for every component's empty/error states, and E2E user journeys at 360×740 and 1440×900 with an axe scan. Until phase 13, kotoba-fe only had `src/lib/*.check.mjs` run by `node --test`: no coverage, no DOM, no browser. kotoba-be already uses Vitest 4 (unit) and supertest (e2e).

## Options
1. Keep `node --test` for logic, add Playwright only. No coverage threshold, no component tests: fails §7.
2. Jest + RTL + Playwright. Needs Babel/SWC transforms for ESM and TS; a second test runner in the repo next to the BE's Vitest.
3. Vitest + RTL + jsdom + Playwright + `@axe-core/playwright`. Same runner as kotoba-be; native ESM/TS; built-in v8 coverage with thresholds.

## Decision
Option 3. New devDependencies of kotoba-fe, each with its reason:
- `vitest`, `@vitest/coverage-v8`: unit/component runner, same major as kotoba-be; coverage thresholds (90% lines and branches on `src/lib/**`).
- `jsdom`: DOM for component tests.
- `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`: query by role/label, realistic interaction, readable DOM matchers (§7.4).
- `@vitejs/plugin-react`: JSX transform for Vitest, as recommended by the Next.js Vitest guide (`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`).
- `@playwright/test`: E2E in two projects, `mobile` 360×740 and `desktop` 1440×900; its `webServer` starts kotoba-be and kotoba-fe.
- `@axe-core/playwright`: axe scan in E2E, failing on serious/critical violations.

All are widely used, actively maintained, MIT (axe-core: MPL-2.0, used as a dev tool only, not shipped).

`src/lib/*.check.mjs` are converted to `src/lib/*.test.ts` with the same assertions and then deleted. No new `.check.mjs` files.

## Consequences
- `npm run check` in kotoba-fe = lint + typecheck + test:coverage + build. E2E (`npm run test:e2e`) runs separately because it needs kotoba-be.
- In the cloud session the preinstalled Chromium is used by Playwright; locally, run `npx playwright install chromium` once.
- Async Server Components cannot be rendered by RTL (Next docs); they are covered by Playwright instead.
