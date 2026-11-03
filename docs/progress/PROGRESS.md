# Progress

Source of truth for resuming a session (AGENTS.md §13). Roadmap: `docs/plan/PLAN.md`.

- Branch: `feat/n5-full` (pushed to `origin feat/n5-full`).
- Node: the cloud image's default `node` is v22; use `/opt/node24/bin` (v24.22.1): `export PATH=/opt/node24/bin:$PATH`.
- BE setup: `cp kotoba-be/.env.example kotoba-be/.env` before `npm ci` (the `postinstall` runs `prisma generate`, which needs `DATABASE_URL`).

## Status

| Task / phase | Status | Commit |
|---|---|---|
| 0–13 (original plan, `docs/plan/original-n5.md`) | DONE | up to `389557c` |
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
| 24b–35 | TODO | |

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

## Next step
Phase 24 (N4 vocab, batches of ~200: 24a, 24b, 24c…), one `content` agent call and one commit per batch, words placed in N4 lessons 26–44, kanji gate (kanji level ≥ word level). Write `docs/phases/24-n4-vocab.md` first. Decide the /vocab due-count question in BACKLOG (phase 22) when N4 words land.
Note: kill stray `next-server` / `kotoba-be/dist/main` processes before `npm run test:e2e`. E2E sign-ups share kotoba-be's limit of 10 per IP per hour; a new spec that registers must use its own `x-forwarded-for` (see `e2e/daily.spec.ts`). `e2e/sync-status.spec.ts` stops and restarts kotoba-be (`e2e/backend.ts`, also the `globalTeardown`), so it needs `lsof` and a built `kotoba-be/dist`.
