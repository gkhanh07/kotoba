# ADR 002: Additive fields in stored progress do not bump schemaVersion

- Status: accepted
- Date: 2026-11-03

## Context
User progress lives in localStorage under `kotoba.srs.v1` (and on the server in `Card`). AGENTS.md §6 requires a `schemaVersion` bump plus a migration for every structural change. Phase 16 adds `lapses` (number of wrong answers) to each card. Bumping the key to `v2` for an optional counter would force a migration path for every reader and writer (store, sync, merge) for no change in meaning.

## Options
1. Bump to `kotoba.srs.v2` for every new field, with a v1→v2 migration.
2. Bump only when a field changes meaning, is renamed or is removed; new optional fields with a default are added in place.

## Decision
Option 2.
- A new field must be optional with a documented default (`lapses` defaults to 0) on the FE and have `@default(...)` on the BE column.
- Every reader (`migrate()`, `parseSrs()`, `isCard` in kotoba-be) must accept a card without the field.
- Mandatory test: a fixture of an old card without the field (e.g. `kotoba-fe/tests/fixtures/progress.v1.without-lapses.json`) loads, round-trips and keeps all its other data.
- Renaming, removing or redefining a field still bumps `schemaVersion` with a sequential migration and old-version fixtures (AGENTS.md §6).

## Consequences
- Old data stays valid without migration; old clients ignore the unknown field.
- Merge keeps "newer `at` wins": the field travels with its card, so two offline devices may lose one increment of `lapses` (accepted).
