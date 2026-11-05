# Phase 16: wrong-answer count (`lapses`) and "often wrong" items

Roadmap: `docs/plan/PLAN.md` §16, the "Số lần sai" decision, ADR 002. Rules: `AGENTS.md`.

## Goal
Answer "where am I weak?": count how many times each item was answered wrong, show the worst items on the dashboard, and let the learner review just those.

## Scope
In: `lapses` on cards (FE localStorage, BE `Card` column, sync both ways), `weakest(srs, n)`, dashboard block "Hay sai", `/review?weak=1`.
Out: per-direction lapses (phase 17 keeps one schedule per item), resetting lapses, showing lapses on detail pages (phase 19).

## Data (ADR 002: additive, no schemaVersion bump)
- FE `Card = { box, due, at, lapses? }`; missing `lapses` means 0. Key stays `kotoba.srs.v1`.
- BE `Card.lapses Int @default(0)`, migration named `lapses`. Existing rows get 0 via `prisma migrate deploy`.
- `isCard` (BE) accepts an optional `lapses`: integer 0–10000. Anything else (negative, fraction, string, > 10000) → 400 `cards`.
- `PUT /progress` stores `lapses` with the card (default 0 when absent); `GET`/`PUT /progress` return `lapses` on every card.
- Merge stays "newer `at` wins"; `lapses` travels with its card (`ponytail:` two offline devices may lose one increment).
- FE `parseSrs`/`migrate` accept cards with or without `lapses`; a card with an invalid `lapses` (negative, non-integer, non-number) makes the deck invalid like any other bad field. Remote cards from the BE keep their `lapses`.
- Constant `WEAK_MIN_LAPSES = 2` and `WEAK_LIST_SIZE = 5` in `kotoba-fe/src/config/srs.ts`.

## Behaviour
- `apply(s, id, correct, today, now)`: wrong → `{ box: 0, due: today, at: now, lapses: (old ?? 0) + 1 }`; right → keeps the existing `lapses` (omitted if it was never set, so untouched cards stay byte-identical). A right answer before the card is due still returns `s` unchanged.
- `weakest(srs, n)`: cards with `lapses ≥ WEAK_MIN_LAPSES`, sorted by `lapses` desc, then `box` asc, then id asc (stable, deterministic); first `n`; returns `{ id, lapses, box }[]`.
- Dashboard block "Hay sai" (only when `weakest` is non-empty): up to 5 items, each the item's front text (kana/kanji/word, `lang="ja"`) with "sai N lần" and a link to its detail page (kanji → `/kanji/<char>`, vocab → `/lessons/<n>#l-vocab` until phase 19, kana → `/kana?script=<script>`), and a button-link "Ôn các mục này" → `/review?weak=1`.
- `/review?weak=1`: the queue is the `weakest(srs, Infinity)` items (all with `lapses ≥ 2`), in that order, regardless of due date; combinable with `kind`. Empty → the existing empty panel with the text "Chưa có mục nào hay sai".

## Acceptance criteria
- **AC-1** Given an existing DB, when `prisma migrate deploy` runs, then `Card` has `lapses` defaulting to 0 and old rows read as 0.
- **AC-2** `PUT /progress` with `lapses: 3` stores it; `GET /progress` returns it; a card without `lapses` is accepted and returned with `lapses: 0`; invalid `lapses` (−1, 1.5, "2", 10001) → 400 `cards`.
- **AC-3** `apply` increments `lapses` on a miss and keeps it on a hit; an old card without `lapses` missed once has `lapses: 1`.
- **AC-4** `weakest` filters `≥ 2`, sorts lapses desc, box asc, id asc, and cuts at `n`; empty srs → `[]`.
- **AC-5** An old-format deck (fixture `kotoba-fe/tests/fixtures/progress.v1.without-lapses.json`) parses, renders the same counts, and gets `lapses: 1` after one miss; nothing else in it changes.
- **AC-6** Dashboard shows "Hay sai" with exact items and "sai N lần" in `weakest` order, max 5, hidden when empty; links point to the right pages.
- **AC-7** `/review?weak=1` asks exactly the weak items; empty state when none.
- **AC-8** E2E: as a guest, answer one vocab wrong twice in `/review` → the dashboard (after sign-up, since the dashboard is the signed-in home) shows it with "sai 2 lần" → "Ôn các mục này" opens `/review?weak=1` with that item. Axe clean, no :4000 calls, both projects.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `test/progress.e2e-spec.ts` (fresh `test.db` via migrate deploy; card without lapses reads 0) | BE e2e |
| AC-2 | `test/progress.e2e-spec.ts` lapses round-trip, absent, each invalid value; `src/progress.spec.ts` `isCard` cases | BE e2e + unit |
| AC-3,4 | `src/lib/srs.test.ts` | Vitest |
| AC-5 | `src/lib/srs.test.ts` + `store.test.ts` with the fixture | Vitest |
| AC-6 | `src/app/Dashboard.test.tsx` (or a `Weak` component test) with a fixed srs: exact rows, order, max 5, hidden when empty | RTL |
| AC-7 | `src/app/review/ReviewApp.test.tsx` weak queue + empty | RTL |
| AC-8 | `e2e/lapses.spec.ts` | E2E |

## §7.2 case groups
- Boundaries: lapses 0, 1 (not weak), 2 (weak), 10000 (max), 10001 (rejected); list of exactly 5 and 6 weak items.
- Empty: no cards / no weak cards → block hidden, empty review state.
- Old data: card without `lapses` (fixture), server rows created before the migration.
- Network/offline: sync unchanged (existing behaviour); N/A beyond it.
- Concurrency: two devices offline — accepted loss of one increment (documented). Double click on grade: existing guard in ReviewApp.
- Time: N/A (lapses are counts, not dates).
- Persistence: reload keeps lapses (localStorage); sign-in pushes them; GET returns them.
- Navigation: `?weak=1` direct URL; unknown `weak` values ignored (only `"1"` enables it).
- Keyboard & a11y: the block is a list with links; axe in E2E.
- Display: long vocab text in the block wraps at 360px.
- Large data: N/A (`weakest` is O(n log n) over the deck, ≤ a few thousand cards).

## Steps
1. `test`: BE e2e/unit + FE Vitest/RTL + E2E, failing first.
2. `be` (schema, migration, `isCard`, `rows`, upsert) and `fe` (srs, store, Dashboard, ReviewApp) in parallel.
3. Main agent runs E2E, `reviewer`, gate, commit, push, PROGRESS.

## Self-review notes
- `reviewer`: PASS. Fixed after review: scroll-margin now on the card's overlay button (BUG-003 regression); the dashboard mapping moved to `src/lib/weak.ts` (`itemLinks`, `weakItems`) with exact-value tests for kana/kanji/vocab links, and unknown ids are dropped before the cut; FE caps `lapses` at `MAX_LAPSES = 10000` like the BE (apply clamps, parseSrs rejects more) so sync can never 400 on it.
- Main-agent edit to an old test: `src/lib/srs.test.ts` "resets to box 0 due today on a miss" now expects `lapses: 1` — required by AC-3, not a weakening.
- Scope addition: BUG-003 (card names, axe) found by this phase's E2E, fixed here; `/flashcards` added to the smoke E2E.
- Note: the dashboard receives a link map for every item (~1k entries) to label ≤ 5 rows; fine at N5 size, revisit with phase 22 pagination.
