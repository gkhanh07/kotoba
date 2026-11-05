# Phase 14: mock test (finish the FE part)

Roadmap: `docs/plan/PLAN.md` §14 and the "Quyết định mới" table. Rules: `AGENTS.md`.

## Goal
A learner opens `/test`, picks a paper, takes it against a 60-minute timer, submits (or is auto-submitted at zero), sees the score per part and the weakest part, reviews every question with the right answer and an explanation, and can retry only the questions they got wrong. Answers survive a reload. Nothing is sent to the server.

Users: guests and signed-in learners alike (results are local only).

## Scope
In:
- BE content: `minutes: 60` for `n5-1`; a Vietnamese `explain` on all 45 questions; `content.spec.ts` checks `explain` is non-empty; e2e count fixed.
- FE: `src/lib/test.ts` (pure) + tests, `/test` list, `/test/[id]` with `TestApp` (intro → taking → result → review, plus "retry wrong"), the `{…}`/`★` renderer, nav entry "Thi thử", dashboard "resume" link, storage readers/writers in `src/lib/`.
Out: listening section, server-side scoring or result sync, per-part timers (`ponytail:` one shared clock), N4+ papers.

## Data and storage (no change to user progress)
- Paper shape (from `GET /tests/:id`, already shipped): `{ id, title: {vi,en}, minutes, reviewed, parts: [{ part, passage?, questions: [{ q, choices[4], answer, explain }] }] }`. Several `parts` entries may share the same `part` name (one per reading passage).
- A question is addressed by its **flat index** in paper order (0-based across all parts). The UI shows it 1-based.
- In-progress attempt: `sessionStorage["kotoba.test.<id>"]` = `{ v: 1, startedAt: number (UTC ms), answers: (number|null)[], flagged: number[], current: number }`. Parsed with a type guard; invalid/foreign data is ignored (treated as no attempt), never thrown.
- Final result: `localStorage["kotoba.tests.v1"]` = `{ [paperId]: { right, total, parts: {part,right,total}[], answers: (number|null)[], at: number } }`, one result per paper (latest wins). A broken value is not overwritten on read; writing a new result replaces only that paper's entry if the rest parses, otherwise backs up the raw value to `kotoba.tests.v1.bak` first.
- "Retry wrong" attempts are never written to `kotoba.tests.v1`.
- Constants in `kotoba-fe/src/config/test.ts`: storage keys, `TEST_RESULTS_KEY`, `TEST_SESSION_PREFIX`.

## Pure functions (`kotoba-fe/src/lib/test.ts`)
- `flatten(paper)` → `{ index, part, passage?, q, choices, answer, explain }[]`.
- `score(paper, answers)` → `{ right, total, parts: { part, right, total }[] }`; parts grouped by `part` name, in order of first appearance; unanswered counts as wrong.
- `remaining(startedAt, minutes, now)` → ms left, clamped to ≥ 0.
- `wrongIds(paper, answers)` → flat indexes answered wrong or not answered, ascending.
- `weakest(result)` → the part with the lowest `right/total` (ties: first in paper order); `null` if `total` is 0.
- `formatClock(ms)` → `mm:ss` (ceil to the second; `60:00` at start, `00:00` at 0).
- `segments(q)` → `{ text, kind: "plain" | "underline" | "blank" }[]` for the `{…}` → `<u>` and `★` → blank-box renderer.
- `parseSession(raw)`, `parseResults(raw)` type guards.

## Interfaces (contract between `test` and `fe`)
- `src/lib/test.ts` exports the types `Paper`, `Part`, `Question`, `Flat`, `Score`, `Session`, `Results` and the functions above. `Paper` matches the BE shape.
- `src/lib/testStore.ts` (browser-only readers/writers): `readSession(id)`, `writeSession(id, s)` (returns `false` when storage throws), `clearSession(id)`, `findSession()` → `{ id, session } | null` (first `kotoba.test.*` entry that parses), `readResults()`, `saveResult(id, result)`.
- `src/config/test.ts`: `TEST_SESSION_PREFIX = "kotoba.test."`, `TEST_RESULTS_KEY = "kotoba.tests.v1"`.
- `src/app/test/[id]/TestApp.tsx`: `export function TestApp({ paper, lang }: { paper: Paper; lang: Lang })` (client). Strings in `testText` (`{ vi, en }`) in `src/lib/library.ts` or a new `src/lib/testText.ts`.
- `src/app/test/Last.tsx` (client island on `/test`): `export function Last({ id, total, lang })` shows the saved score or nothing.
- `src/app/test/Question.tsx` or a function in `TestApp.tsx`: `<QuestionText text lang />` renders `segments()`.
- Accessible names used by tests (vi): button "Bắt đầu"; palette buttons "Câu 3, đã làm" / "Câu 3, chưa làm" / "Câu 3, đã đánh dấu" (current one also has `aria-current="step"`); buttons "Câu trước", "Câu sau", "Đánh dấu", "Nộp bài"; dialog buttons "Nộp bài" and "Làm tiếp"; result buttons "Xem lại câu sai", "Làm lại câu sai"; the timer has `role="timer"` and `aria-label` "Thời gian còn lại"; progress text "2/6".
- Choices are radio inputs in a `radiogroup`-like fieldset whose legend is the question number, so `getByRole("radio", { name })` works.

## Acceptance criteria
- **AC-1** Given the BE, when `GET /tests` is called, then `n5-1` has `minutes: 60` and 45 questions; every question in `tests.json` has a non-empty `explain` (content spec).
- **AC-2** Given a paper and answers, `score` returns exact totals per part and overall; `wrongIds` and `remaining` are exact (incl. boundaries: 0 answered, all right, 1 s left, past the end).
- **AC-3** Given `/test`, then each paper shows its title, minutes and question count from `GET /tests`, the note "Không có phần nghe", and the last saved score from `kotoba.tests.v1` when present (`37/45 — 82%`), nothing when absent.
- **AC-4** Given `/test/<unknown>`, then the page is a 404.
- **AC-5** Intro shows question count, minutes, the list of parts, the no-listening note and an amber "Bắt đầu" button; pressing it starts the clock.
- **AC-6** While taking: a question palette 1…N with states unanswered / answered / flagged / current (`aria-current="step"` on current; each button's `aria-label` states number and state); progress `answered/N`; a countdown `mm:ss`; Prev/Next buttons.
- **AC-7** Keyboard: `1–4` choose, `←/→` move, `F` toggles flag; ignored in inputs and with modifier keys; a help panel lists the shortcuts.
- **AC-8** Every answer/flag/move is written to sessionStorage; after a reload the attempt resumes with the same answers, flags, question and remaining time.
- **AC-9** When the timer reaches zero, the attempt is submitted **exactly once** (also when the page is reloaded after the deadline: it submits on load).
- **AC-10** Submitting manually opens a native `<dialog>` confirming, which states the number of unanswered questions; cancel returns to the test.
- **AC-11** Result shows `right/total — pct%` (pct rounded to the nearest integer), a per-part table with exact numbers, the weakest part, and buttons "Xem lại câu sai" and "Làm lại câu sai"; the result is saved to `kotoba.tests.v1` and the session entry is removed.
- **AC-12** Review ("Xem lại câu sai") shows, per wrong or unanswered question, the learner's choice, the right answer (not by colour alone: text label) and the explanation.
- **AC-13** "Làm lại câu sai" runs only the `wrongIds` questions, without a timer, and its outcome does not change the saved result.
- **AC-14** `{…}` renders as `<u>` and `★` as an empty box with an accessible label, via one shared helper used in taking, review and retry.
- **AC-15** Nav: "Thi thử" in `SiteBar` and `MenuNav` with `current: "test"`.
- **AC-16** Dashboard: when a session attempt exists, it shows "Làm tiếp <PAPER> · câu k/N" linking to `/test/<id>`.
- **AC-17** No browser request goes to :4000; axe has 0 serious/critical on `/test` and every `/test/[id]` step at 360×740 and 1440×900; no console errors.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `content/content.spec.ts` explain non-empty; `test/content.e2e-spec.ts` `/tests` list (minutes 60) | BE unit + e2e |
| AC-2 | `src/lib/test.test.ts` score / remaining / wrongIds / weakest / formatClock / segments / parse* | Vitest |
| AC-3 | `e2e/test.spec.ts` list page values; `TestList` island RTL (with / without saved result, broken storage) | E2E + RTL |
| AC-4 | `e2e/test.spec.ts` `/test/nope` → 404 | E2E |
| AC-5,6 | `TestApp.test.tsx` intro → start, palette states and labels, progress text | RTL |
| AC-7 | `TestApp.test.tsx` keys 1–4, ←/→, F; ignored with ctrl / inside input | RTL |
| AC-8 | `TestApp.test.tsx` writes session; remount resumes; `e2e/test.spec.ts` reload keeps answers | RTL + E2E |
| AC-9 | `TestApp.test.tsx` `it('auto-submits exactly once when the timer reaches zero')` (fake timers); E2E: move `startedAt` back 61 min via `page.evaluate`, reload → result | RTL + E2E |
| AC-10 | `TestApp.test.tsx` dialog text with unanswered count; cancel | RTL |
| AC-11 | `TestApp.test.tsx` exact numbers from a fixture paper; storage written; E2E full run on `n5-1` checks `x/45 — y%` equals the stored result | RTL + E2E |
| AC-12 | `TestApp.test.tsx` review rows | RTL |
| AC-13 | `TestApp.test.tsx` retry only wrong, saved result unchanged; E2E retry flow | RTL + E2E |
| AC-14 | `test.test.ts` segments; `TestApp.test.tsx` `<u>` present | Vitest + RTL |
| AC-15 | `e2e/test.spec.ts` nav link with `aria-current="page"` | E2E |
| AC-16 | `Dashboard` resume link RTL or E2E (start, go to `/`, link text "câu k/45") | E2E |
| AC-17 | every E2E above uses `e2e/fixtures.ts` + `axe` + :4000 request listener, both projects | E2E |

Fixture paper for unit/RTL: `kotoba-fe/tests/fixtures/paper.small.json` (3 parts, 6 questions, one shared part name).

## §7.2 case groups
- Happy path: AC-11 full run. Boundaries: 0 answered, all answered, 1 s left, exactly 0, after the deadline (AC-2, AC-9).
- Empty: no saved result / no session (AC-3, AC-16). Paper with 0 questions: N/A (BE content spec forbids it).
- Broken/old data: invalid JSON or wrong shape in sessionStorage and localStorage is ignored, not thrown, and not overwritten without a backup (parse* tests, RTL).
- Loading: no `loading.tsx` for `/test` (N/A by design): a streamed loading boundary made `notFound()` answer HTTP 200 instead of 404; both pages are cached server fetches.
- Network: BE down → `/test` falls into the new `src/app/test/error.tsx` (server fetch; not covered by an automated test yet, BACKLOG); no client fetch exists. Storage full: write failure keeps the attempt in memory and shows nothing broken (RTL with a throwing `setItem`).
- Concurrency: double-click on submit/confirm submits once (same guard as AC-9). Two tabs: N/A for scoring (sessionStorage is per tab by design); results: latest write wins (ADR not needed, documented here).
- Time: hidden tab/sleep — the clock is derived from `startedAt`, not from ticks, so it is correct after wake (RTL advancing system time). Reload midway (AC-8). Day rollover/time zone: N/A (durations only, UTC ms).
- Transitions: intro→taking→result→review/retry; result can't go back to taking for the same attempt.
- Navigation: direct URL, unknown id → 404 (AC-4); back/forward keeps the session (sessionStorage).
- Keyboard & a11y: AC-7, AC-17; dialog is native `<dialog>` (focus trapped, Esc closes).
- Display: long reading passages wrap at 360px; screenshots at both viewports + a 768px check.
- Large data: N/A (≤ 100 questions per paper).

## Steps
1. BE: minutes 60 + spec + e2e (main agent); `explain` for 45 questions (`content`).
2. `test`: Vitest for `lib/test.ts`, RTL for `TestApp`, E2E `e2e/test.spec.ts` — failing first.
3. `fe`: implement until green.
4. `reviewer`, Quality Gate, commit, push, PROGRESS.

## Self-review notes
- `reviewer`: PASS, no Critical/High. Fixed after review: saved answers must be integers; a `startedAt` in the future is clamped to now; the ★ box label carries the UI `lang`; the dashboard hides "Làm tiếp" once the deadline has passed (each with a test, seen failing first). AC-12 clarified to wrong/unanswered questions, matching the "Xem lại câu sai" button.
- Main-agent edits to contract tests (reasons): typed `c: unknown[]` in `TestApp.test.tsx` (TS7006 broke typecheck/build); the 404 E2E now asserts that the only console error is Chromium's own "Failed to load resource … 404" for the document, then clears it (Chromium always logs it; any other error still fails); removed an unused `MINUTE` and an unused `_v` (lint warnings).
- `eslint.config.mjs` ignores generated `playwright-report/`, `test-results/`, `coverage/`.
- Left as Low/BACKLOG: ←/→ `preventDefault` outside inputs; `error.tsx` without a test; test-only non-null `!` in `e2e/test.spec.ts`.
