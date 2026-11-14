# Progress

Source of truth for resuming a session (AGENTS.md §13). Roadmap: `docs/plan/PLAN.md`.

- Branch: `feat/n5-full` (pushed to `origin feat/n5-full`).
- Node: the cloud image's default `node` is v22; use `/opt/node24/bin` (v24.22.1): `export PATH=/opt/node24/bin:$PATH`.
- BE setup: `cp kotoba-be/.env.example kotoba-be/.env` before `npm ci` (the `postinstall` runs `prisma generate`, which needs `DATABASE_URL`).

## Status

| Task / phase | Status | Commit |
|---|---|---|
| 0–13 (original plan, removed from the repo, see git history) | DONE | up to `389557c` |
| 14 BE part: `tests.json` (`n5-1`, 45 questions), `GET /tests`, `GET /tests/:id` | DONE | `d43665d` |
| A1 `AGENTS.md`, `CLAUDE.md`, `kotoba-be/AGENTS.md`, pointer in `kotoba-fe/AGENTS.md` | DONE | see git log (`docs: add agent working rules and progress docs`) |
| A2 PROGRESS, BUGS, BACKLOG, ADR 001, ADR 002 | DONE | same commit |
| A3 phase 13.5: test infrastructure | DONE | `563eb00` (BE scripts), `chore(test): add vitest, rtl and playwright with axe to kotoba-fe` |
| A4 subagents check against `AGENTS.md` | DONE | `49fa1ad`; agents load via the Agent tool in this session; `reviewer` tried on the A3 diff (PASS, read-only) |
| 14 BE: minutes 60, `explain` on 45 questions, spec check | DONE | `02434f3` |
| 14 FE part: mock test flow (spec `docs/phases/14-mock-test.md`) | DONE | `feat(test): mock exam flow` |
| 15 N5 vocab to ~700 (batch 15a: +195 → 694 words) | DONE | `content(n5): vocab batch 15a` |
| 16 `lapses` + "Hay sai" + `/review?weak=1` (spec `docs/phases/16-lapses.md`) | DONE | `feat(srs): count wrong answers and review often-wrong items` |
| 17 multi-direction cards + flashcard shortcuts (spec `docs/phases/17-card-directions.md`) | DONE | `feat(review): ask cards in several directions` |
| 18 study day in Asia/Ho_Chi_Minh (ADR 003) | DONE | `861dfe1` |
| 18 daily session via `/review`, `currentLesson`, end stats, dashboard link (spec `docs/phases/18-daily-session.md`, ADR 004) | DONE | `feat(review): daily session with new items of the current lesson` |
| 19 word page `/vocab/[word]`, links to it, `similar` kanji (spec `docs/phases/19-vocab-page-similar-kanji.md`) | DONE | `feat(vocab): word page and easily confused kanji` |
| 20 heatmap on the dashboard, sync status in the site bar (spec `docs/phases/20-heatmap-sync-status.md`) | DONE | `feat(dashboard): study heatmap and sync status` |
| 21 data export: `GET /me/export`, `/settings/export` download (spec `docs/phases/21-export.md`) | DONE | `feat(account): download study data as JSON` |
| 22 levels: BE `level` column, `?level=`/`?page=`, seed by row diff (ADR 005, BUG-004); FE level tabs, paging, lesson level groups, search badge (spec `docs/phases/22-levels.md`) | DONE | `4e437d6` (BE), `feat(levels): level tabs, paging and level groups in the app` (FE) |
| 23 N4 kanji: 181 kanji, lessons 26–45, `similar` pairs (spec `docs/phases/23-n4-kanji.md`) | DONE | `content(n4): kanji and lessons 26-45` |
| 24a N4 vocab lessons 26–32 (178 words) | DONE | `content(n4): vocab batch 24a` |
| 24b N4 vocab lessons 33–38 (197 words) | DONE | `content(n4): vocab batch 24b` |
| 24c N4 vocab lessons 39–44 (203 words; N4 578 in all) | DONE | `content(n4): vocab batch 24c` |
| 24 review fixes (7 N4 words) | DONE | `cc2791e` |
| 25 N4 grammar: 44 points in lessons 26–44 (spec `docs/phases/25-n4-grammar.md`) | DONE | `content(n4): grammar for lessons 26-44` |
| 26 N4 mock test `n4-1` (58 questions, 80 min, parts `usage` and `text`), N5 → N4 journey (spec `docs/phases/26-n4-mock-test.md`) | DONE | `424a205` (FE labels, journey e2e), `content(n4): mock test paper n4-1` |
| Responsive fix: readable column on wide screens, no side scroll on /kana, sync-status e2e on Windows (BUG-006/007/008) | DONE | `7df0a06`, `0cc53fd` |
| 27 N3 kanji: 341 kanji from Waller's list, lessons 46–81, 40 `similar` pairs (spec `docs/phases/27-n3-kanji.md`, ADR 006); BUG-010, BUG-011 | DONE | `8bb6809` |
| Fix from the `/` critique: dashboard totals per goal level (BUG-012), "learned" copy matches the SRS code (ADR 007), stale landing copy (spec `docs/tasks/critique-home.md`) | DONE | `fix(dashboard): count totals by the goal's scope and correct the landing copy` |
| Store hardening: stored data that cannot be read is copied to `<key>.broken` before a write, resets and pulls are all-or-nothing, no empty catch left (spec `docs/tasks/store-hardening.md`, ADR 008, BUG-013) | DONE | `fix(store): keep stored data that cannot be read or written` |
| Hán Việt from a checked source and the round-1 sample errors: authored `hv` for 625 kanji (ADR 009, BUG-009), 中 ジュウ (BUG-014), すく (BUG-015), causative に/を (BUG-016); kanji samples redrawn (spec `docs/tasks/hanviet-fix.md`) | DONE | `fix(content): author Hán Việt readings from a checked source` |
| User sample review of N5, N4 and N3 kanji: seeded samples of 30 per kind | DONE (2026-11-09): 270/270 correct, 0/30 errors per kind. The review was drafted by an AI tool outside the repo; the user read it and accepted it. Risk: meanings, examples and explanations had no fully independent human check. `reviewed: true` is still unset: only the user sets it (AGENTS.md §12) | sheet removed after acceptance (see git history), seed 20261105 (kanji: 20261108 after ADR 009); before phase 28, see PLAN (AGENTS.md §12) |
| 28 N3 vocab (spec `docs/phases/28-n3-vocab.md`): 28a lessons 46–49, 222 words; 28b lessons 50–53, 191 words; 28c lessons 54–57, 206 words; 28d lessons 58–61, 206 words; 28e lessons 62–65, 193 words; 28f lessons 66–69, 215 words; 28g lessons 70–73, 203 words; 28h lessons 74–77, 189 words; 28i lessons 78–80, 149 words (N3 total 1,774) | DONE | `content(n3): vocab batch 28a`, `content(n3): vocab batch 28b`, `content(n3): vocab batch 28c`, `content(n3): vocab batch 28d`, `content(n3): vocab batch 28e`, `content(n3): vocab batch 28f`, `content(n3): vocab batch 28g`, `content(n3): vocab batch 28h`, `content(n3): vocab batch 28i` |
| 29 N3 grammar (spec `docs/phases/29-n3-grammar.md`): 29a lessons 46–63, 32 points; 29b lessons 64–80, 28 points (N3 total 60) | DONE | `content(n3): grammar batch 29a`, `3f53292` |
| 30 N3 mock test `n3-1` (74 questions, 100 min, 8 reading passages), paper kanji gate (spec `docs/phases/30-n3-mock-test.md`); N3 review sheet `docs/tasks/sample-review-n3.md`, seed 20261113. Paper drafted by Codex on its own file, grammar by the `content` subagent; Codex review fixed 3 content bugs | DONE | `f104218` |
| 31–34 (N2) | DROPPED | user decision 2026-11-04: the roadmap stops at N3 |
| 35 (finish) | DROPPED | user decision 2026-11-11: removed from the roadmap; its required items (EDRDG credits, N2 tab removal) are in BACKLOG |
| UI redesign: one visual language from the hero to every study screen, 10 page groups (spec `docs/tasks/ui-redesign.md`, ADR 010). The user's 29b test that was stashed here landed with 29b (`3f53292`); no stash is left | DONE | 731f6ef, 97669e2, 2c02360, d55f2b0, 22f2e58, 6c017bb, 3fe5337, 72e5758, 2a34916, 68b1217, f32f62f (one `feat(ui): …` per group); last gate: FE 658 tests, lib coverage 98.23%, e2e 240 passed |

Phase hashes (0–13): 0 `976dd4c`, 1 `30808b6`, 2 `fdfc1e2`, 3 `55b04a0`, 4 `ad94fb9`, 5 `382a4af`, 6 `08cf14f`, 7 `9d1d363`, 8 `ba4f55b`, 9 `7e91635`, 10 `86f589a`, 11 `33dcf6c`, 12 `141141d`, 13 `389557c`.

## Baseline (measured 2026-11-03 at `fd87e2a`, Node 24.22.1)

kotoba-be:
- `npm test`: 4 files, 15 tests passed.
- `npm run test:e2e`: 4 files, 18 tests passed.
- `npm run lint`: 0 findings. `npx tsc --noEmit`: 0 errors. `npm run build`: OK.
- `npm run jmdict`: 499 words checked against 466113 JMdict spellings, OK.
- Unit coverage of `src/` (excluding generated Prisma client): statements 26.68%, branches 34.56%, functions 33.33%, lines 25.74%. Threshold set to 26/34/33/25 in `kotoba-be/vitest.config.ts`; `check` runs `test:cov`.

kotoba-fe:
- `npm run check` (`node --test src/lib/*.check.mjs`): 5 files, 5 tests passed, 91 `assert.*` calls in total (account 16, activity 31, flashcards 6, search 10, srs 28).
- `npm run lint`: 0 findings. `npm run build`: OK, 19 routes.
- `npx tsc --noEmit` alone fails (`PageProps`/`LayoutProps` undefined) until `next typegen` or `next build` has generated `.next/types`; it passes after a build. The `typecheck` script therefore runs `next typegen` first.

After phase 13.5 (2026-11-03):
- kotoba-fe `npm run check`: lint 0, typecheck 0, Vitest 11 files / 202 tests pass (103 of them from the 91 old `.check.mjs` assertions), coverage `src/lib/**` lines 100%, branches 99.62%, build OK.
- kotoba-fe `npm run test:e2e`: 8 passed (smoke on `/`, `/kana`, `/review` + accessible-name test, mobile and desktop), axe 0 serious/critical. Found and fixed BUG-001, BUG-002.
- kotoba-be `npm run check`: lint, typecheck, 15 unit (with coverage gate), 18 e2e, content 8, JMdict, build all pass.

After phase 14 (2026-11-03):
- kotoba-fe `npm run check`: Vitest 17 files / 335 tests, coverage `src/lib/**` lines 98.24%, branches 97.42%; build OK.
- kotoba-fe `npm run test:e2e`: 32 passed (smoke + 13 mock-test journeys × 2 projects, + 768px check), axe 0 serious/critical, no :4000 requests.

After phase 15: BE check green (15 unit, 18 e2e, 8 content, JMdict 694 words); FE E2E 34 passed incl. `/vocab` counts = JSON.

After phase 16: FE Vitest 399 tests, E2E 42 passed; BE 29 unit + 28 e2e; migration `20261103075918_lapses`. Fixed BUG-003.

After phase 17: FE Vitest 449 tests, E2E 48 passed.

After phase 18: FE Vitest 500 tests (suite also passes under TZ=UTC, America/Los_Angeles, Asia/Tokyo, Pacific/Kiritimati), coverage `src/lib/**` lines 98.24%, branches 96.35%; E2E 52 passed. BE unchanged.

After phase 19: BE check green (30 unit, 28 e2e, 9 content, JMdict 694 words; `npm run kanjidic` reproduces kanji.json); FE Vitest 509 tests, E2E 62 passed.

After phase 20: FE Vitest 530 tests, E2E 66 passed.

After phase 21: BE 31 unit + 31 e2e (export +3); FE Vitest 537 tests, E2E 72 passed.

After phase 22: BE 40 unit + 40 e2e + 18 content; seed with unchanged content ~75 ms at 1,080 rows, ~196 ms at 10,480 rows (full rewrite ~5.5 s at 10k, once). FE Vitest 558 tests, E2E 102 passed.

After phase 23: BE 41 unit + 40 e2e + 19 content; FE E2E 106 passed.

After phase 26 (N4 complete): BE 45 unit + 40 e2e + 23 content, JMdict 1,272 words; FE Vitest 559 tests, E2E 116 passed. Content: N5 + N4 = 224 kana, 284 kanji, 1,272 words, 78 grammar points, 45 lessons, 2 papers.

After phase 27: BE 49 unit + 41 e2e + 27 content, JMdict 1,272 words; FE Vitest 559 tests (lib lines 98.44%, branches 96.67%), E2E 166 passed. Content: 625 kanji (103/181/341), 81 lessons. All 341 N3 kanji are `reviewed: false`; BUG-009 (doubtful Hán Việt readings) is OPEN and needs the user to choose a source.

After the `/` critique fix: BE 49 unit + 41 e2e + 27 content; FE Vitest 567 tests (lib lines 98.45%, branches 96.68%), E2E 172 passed. Scope per goal, measured on the content: N5 694 words / 103 kanji, N4 1,272 / 284, N3 or no goal 1,272 / 625.

After store hardening: BE 49 unit + 41 e2e + 27 content; FE Vitest 588 tests (all files lines 98.42%, branches 96.9%; the 90% threshold on `src/lib/**` passed), E2E 172 passed.

After phase 30 (N3 complete, 2026-11-12): BE 58 unit + 41 e2e + 36 content, JMdict 3,046 words, unit coverage 30.57/35.59/33.96/30.06 (thresholds unchanged at 30/35/33/30); FE Vitest 665 tests (lib lines 98.23%, branches 96.98%), E2E 244 passed. Content: N3 = 341 kanji, 1,774 words, 60 grammar points, paper `n3-1`; all `reviewed: false`.

## Stopped here (2026-11-12, after phase 30)
N3, the last level of the roadmap, is complete (AGENTS.md §15 checkpoint). Waiting for the user to: use the app for about 10 minutes on N3, check the N3 samples in `docs/tasks/sample-review-n3.md` (vocab, grammar, paper; seed 20261113) and the copy sample `docs/tasks/vietnamese-copy-content-sample.md`, and decide whether to merge `feat/n5-full` into `main`. `kotoba-fe/src/lib/i18n.ts` holds the user's uncommitted hero edit: leave it alone.

## Next step
None planned in `PLAN.md` after phase 30: wait for the checkpoint above. Fixes from the N3 sample review come first if more than 5% of a kind is wrong.
Note: kill stray `next-server` / `kotoba-be/dist/main` / `nest start --watch` processes before `npm run test:e2e`. E2E sign-ups share kotoba-be's limit of 10 per IP per hour; a new spec that registers must use its own `x-forwarded-for` (see `e2e/daily.spec.ts`). `e2e/sync-status.spec.ts` stops and restarts kotoba-be (`e2e/backend.ts`, also the `globalTeardown`; it finds the process with `lsof`, or PowerShell on Windows, BUG-008), so it needs a built `kotoba-be/dist`. Playwright clears `.next/cache/fetch-cache` before building (BUG-005).

## Vietnamese copy review (2026-11-12)
DONE — direct user request; spec/report: `docs/tasks/vietnamese-copy-review.md`; commit `style(copy): refine Vietnamese wording across the site`. Reviewed all UI dictionaries, page-local text, backend messages and content Vietnamese. Edited 5 dictionaries, dashboard/legal, reset email and 49 Vietnamese content fields in 44 items; logic, API, keys, Japanese, answers and reviewed flags unchanged. Glossary updated in DESIGN; N5-scope wording and English-only export failure recorded in BACKLOG.

Quality Gate: FE check green (665 tests, +7; lines 98.49%, branches 96.98%); BE check green with RUST_LOG=info (57 unit, 41 E2E, 35 content, JMdict 3,046 words, build). Content validation rerun after the final 2 explanation edits: green. Full Playwright: 238/240; both failures used one old text expectation. After updating it, all 14 vocab-page tests passed on mobile/desktop, confirming all 240 distinct cases; no product change between runs. FE lint/typecheck rerun green. Axe 0 serious/critical; screenshots at 360/768/1440 inspected. Existing Vite loader warning and Windows server logs documented in spec. Reviewer PASS. Not pushed from this local session.

Content review sample: `docs/tasks/vietnamese-copy-content-sample.md`, 30 items from the 44 edited entries, seed 20261112; `reviewed: false` remains unchanged and needs the user's review. Phase 29b was pending at that time; it is now DONE (see Status).

## Review hub (2026-11-13)
DONE — direct user request; spec `docs/tasks/review-hub.md`. FE Vitest 675 tests (lib lines 98.54%, branches 97.09%); full Playwright 246 passed, the 2 failures (old `/review$` URL in `daily.spec.ts`) fixed and rerun green with `review-hub.spec.ts` (8/8). Next: audit of empty pages and navigation flow.

## User walkthrough fixes (2026-11-14)
DONE — direct user request: use the app as a learner, then fix the technical bugs and hand the uncertain content questions to Codex (read-only). Fixed BUG-023 (key hints on touch), BUG-024 (mock test question below the fold on a phone), BUG-025 (redirected guest told login is optional), BUG-026 (review ladder broke 5 + 2), in commits 4bfc81b, 02be8d1, c1de90c, each with a failing e2e test first. Copy/design questions and Codex's content findings are in BACKLOG ("User walkthrough follow-ups", "Content review follow-ups"); 16 N5 kanji readings there need a person.

Quality Gate: FE `npm run check` green (680 Vitest tests) per fix; full Playwright 268 passed (mobile + desktop, axe). No BE change. `kotoba-fe/next.config.ts` and `kotoba-fe/src/lib/i18n.ts` hold the user's uncommitted edits: leave them alone.
