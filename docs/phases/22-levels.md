# Phase 22: levels (N5, N4, N3, N2) everywhere, once

Roadmap: `docs/plan/PLAN.md` §22 and the decisions table ("Cấp độ của nội dung", "Số bài", "Lọc theo cấp ở UI", "Danh sách lớn", "Gate kanji trong từ"). Rules: `AGENTS.md`.

## Goal
Every content item carries a JLPT level, the API filters and pages by it, and the UI has level tabs, so N4 → N2 content (phases 23–34) only adds JSON.

## Scope
In:
- **BE.** `Item.level Int @default(5)` + index `[kind, level, sort]`, migration named `level`. Seed writes `level` from JSON (missing → 5). `?level=` (one of 5, 4, 3, 2; anything else → 400 `level`) on `GET /content/:kind`, `GET /search`, `GET /tests`. `?page=` (integer ≥ 1, else 400 `page`) on `GET /content/:kind`: with it the answer is `{ items, page, pages, total }`, `PAGE_SIZE = 100` items a page (`src/config.ts`); without it the bare array as today (backward compatible). Seed time measured and written in PROGRESS; switch to hash-gated seeding only if a 10k-row seed takes over ~2 s.
- **Content.** `level: 5` on every item of `kana.json`, `kanji.json`, `vocab.json`, `lessons.json`, `grammar.json` and on the `n5-1` paper in `tests.json` (ids unchanged). `content.spec.ts`: every item and paper has `level` in {5, 4, 3, 2}; the vocab kanji gate becomes "every kanji in `word` is in `kanji.json` with `level ≥` the word's level" (5 is easiest); a lesson's items share the lesson's level.
- **`scripts/kanjidic.ts`.** Maps KANJIDIC2's old JLPT levels to new ones: 4 → 5, 3 → 4 (old 2 → 3/2 needs the level list of phase 27 and is not mapped yet). Emits only the levels listed in `INCLUDE_LEVELS` (now `[5]`; phase 23 adds 4), keeps authored fields, writes `level`. Re-running it makes no diff.
- **FE.**
  - `src/lib/library.ts`: `LEVELS = [5, 4, 3, 2] as const`, `type Level`, `levelOf(q: string | string[] | undefined): Level` (default 5; unknown → 5), `levelLabel(5) = "N5"`.
  - A shared server component `LevelTabs` (links `N5 N4 N3 N2`, `aria-current="page"` on the active one, keeps other query params it is told to keep) on `/kanji`, `/vocab`, `/grammar`, `/flashcards`, `/test`. Each page shows only that level's items, with an empty state "Chưa có nội dung Nn." when there are none.
  - `/kanji`: `?page=` from the BE, Trước / Sau links and "Trang x / y" when `pages > 1`; page past the end → 404. `/vocab` decks: `?page=` with `DECKS_PER_PAGE = 30` (in `src/config/`), same links.
  - `/lessons`: grouped under one `h2` per level that has lessons ("N5", "N4", …).
  - `/search`: each result shows a level badge "N5".
  - `/legal`: one line naming the source of the level lists (KANJIDIC2's JLPT field, EDRDG licence; Waller lists for N3/N2 when they arrive).
- **Default level.** With no `?level=` a page shows N5. (The roadmap's "level of `currentLesson`" needs the browser's deck and so cannot be known by these server components; recorded in the self-review notes, revisit when N4 content lands in phase 23.)

Out: N4+ content; the N3/N2 level list (`scripts/levels.txt`, phase 27, after its licence is checked); a "current level" setting.

## Acceptance criteria
- **AC-1** Migration `level` applies on an existing `dev.db` and on a fresh DB; every seeded row has the JSON's level.
- **AC-2** `GET /content/kanji?level=5` = all current kanji; `?level=4` = `[]`; `?level=6`/`?level=x` → 400. `/search?q=…&level=4` → `[]`. `/tests?level=5` lists `n5-1`, `?level=4` `[]`.
- **AC-3** `GET /content/vocab?page=1` → `{ items: 100 items, page: 1, pages: ceil(total/100), total }`; last page holds the remainder; page past the end → `items: []` with the same `pages`; `page=0`/`page=x` → 400. With ≥ 5,000 synthetic rows (test DB only) paging stays correct and each page call stays under 200 ms.
- **AC-4** `content.spec.ts` level checks pass; the gate fails for a word whose kanji has a lower level than the word (seen failing with a temporary edit).
- **AC-5** `npm run kanjidic` makes no diff.
- **AC-6** FE: `levelOf` unit tests; tabs on the five pages with the right `aria-current`; `?level=4` shows the empty state on each; `/kanji` and `/vocab` page links appear only when needed and a page past the end is a 404.
- **AC-7** `/lessons` has an "N5" group heading; `/search` results show "N5"; `/legal` names the level source.
- **AC-8** All existing unit/e2e tests pass unchanged except fixed counts updated for the new field; E2E mobile + desktop, axe clean.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1, AC-2, AC-3 | `kotoba-be/test/content.e2e-spec.ts` (+ 5,000-row paging case) | supertest |
| AC-4 | `kotoba-be/content/content.spec.ts` | Vitest |
| AC-5 | `npm run kanjidic && git diff --exit-code content/kanji.json` | script |
| AC-6 | `kotoba-fe/src/lib/library.test.ts`; `kotoba-fe/e2e/levels.spec.ts` | Vitest / E2E |
| AC-7, AC-8 | `kotoba-fe/e2e/levels.spec.ts`, full suite | E2E |

## §7.2 case groups
- Boundaries: page 1, last page, past the end, page 0; exactly 100 items; level 5 and 2.
- Empty: a level with no content (empty states).
- Wrong data: bad `level` / `page` params → 400 (BE), ignored → N5 (FE tabs).
- Old data: DB rows from before the migration get the default 5; stored SRS cards keep their item ids.
- Navigation: direct URLs with `?level=` and `?page=`; page past end → 404.
- Keyboard & a11y: tabs are links in a labelled `nav`, `aria-current`.
- Display: tabs and page links fit 360px.
- Large data: AC-3 with 5,000 rows.
- Network, time, concurrency: N/A (read-only lists).

## Self-review notes
