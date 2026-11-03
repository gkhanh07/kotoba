# Phase 18: daily session through `/review`

Roadmap: `docs/plan/PLAN.md` §18 and the "Ngày học" decision. Rules: `AGENTS.md`.

## Goal
Opening `/review` with no filter gives one daily session: everything due, plus a capped number of new items from the lesson the learner is on. The dashboard's "Tiếp tục học" leads there when it has work. "Today" is the same study day everywhere: the calendar day in `Asia/Ho_Chi_Minh`, whatever the browser's zone.

## Scope
In:
1. `dayKey` in `src/lib/activity.ts` computes the study day in `Asia/Ho_Chi_Minh` (`Intl.DateTimeFormat`); the minute bucket in `record` uses the same clock; streaks, the 90-day trim, the dashboard "days to exam" and the history labels count days on day keys. Separate commit `fix(activity): compute study day in Asia/Ho_Chi_Minh` (ADR 003).
2. Pure `currentLesson(stops, srs)` in `src/lib/library.ts`, used by `app/lessons/Path.tsx` (no behaviour change there).
3. Count of new items learned today (`kotoba.daily.v1`, ADR 004), `NEW_PER_DAY` in `src/config/srs.ts`.
4. `/review` with no `kind`, `lesson` or `weak=1`: due items, then up to `NEW_PER_DAY − newToday` never-seen items of `currentLesson`.
5. End screen of any `/review` queue: items answered, % right on first showing, minutes.
6. Dashboard "Tiếp tục học" → `/review` when the daily session has due or new items, else `continueHref(last)`.

Out: syncing the new-today count to kotoba-be; changing the Leitner intervals; the heatmap (phase 20).

## Behaviour
- **Study day.** `dayKey(d)` = `YYYY-MM-DD` of `d` on the Vietnam wall clock (UTC+7, no DST). `2026-11-02T16:59:59Z` → `2026-11-02`, `2026-11-02T17:00:00Z` → `2026-11-03`. `record` stores minute-of-day on the same clock (0–1439). `today()` in `store.ts` already calls `dayKey`, so SRS due dates follow. Data stored earlier under the browser's zone stays valid (same key format); for a browser outside UTC+7 a day may shift by one once (accepted, ADR 003).
- **Exam countdown.** `examDay(exam)` (`src/lib/account.ts`) = the exam's calendar day as a key; days left = `daysUntil(examDay, today())`.
- **`currentLesson(stops, srs)`** with `stops: { lesson: number; ids: string[] }[]` in lesson order: the first stop where some but not all ids are learned (`isLearned`); else the first stop with ids where not all are learned; else `undefined`. Returns the stop's `lesson` number.
- **`stopsOf(items)`**: groups `{ id, lesson }` items by lesson, ascending, ids in input order.
- **New today.** `store.review(id, …)` adds `id` to today's list when the deck had no card for it before. Stored as `{ day, ids }` under `kotoba.daily.v1`; a different day or unreadable value counts as 0 and is replaced on the next write. `clearLocal` removes it. Not synced (ADR 004).
- **Daily queue.** `newBudget = max(0, NEW_PER_DAY − newToday)`; fresh = items of `currentLesson` with no card, in item order, first `newBudget`. Queue = due items (as today) then fresh. Scope line: "Mục đến hạn và mục mới của bài n" when fresh is non-empty, else "Mọi mục đến hạn". `?weak=0` or any unknown `weak` value counts as no filter.
- **End screen.** After the last card of a non-empty queue: "n mục · đúng p% ngay lần đầu · m phút", where n = distinct items graded, p = round(100 × items whose first grade was "Nhớ rồi" / n), m = distinct clock minutes in which a grade was given (≥ 1).
- **Dashboard.** `due` = due cards (existing total); `fresh` = same budget rule on the content stops. If `due + fresh > 0`: link `/review`, line "Phiên hôm nay: x đến hạn · y mới". Else existing link and line.

## Acceptance criteria
- **AC-1** `dayKey` returns the Vietnam calendar day: `16:59:59Z` and `17:00:00Z` fall on consecutive days, independent of the process `TZ`.
- **AC-2** `record` minute bucket and `summarize` streak/today use the study day (a study at 23:30 VN and 00:10 VN next day are two days).
- **AC-3** `currentLesson` picks started → first open → `undefined`; empty stops are skipped. `Path` marks the same lesson as before.
- **AC-4** New-today count: first grade of a never-seen item counts, a second grade of it or a grade of a known card does not; a new day resets it; broken storage counts 0.
- **AC-5** Bare `/review` for a new guest asks exactly `NEW_PER_DAY` (10) new items of lesson 1; after answering them all (some wrong), reopening asks only the wrong ones.
- **AC-6** Queues with `kind`, `lesson` or `weak=1` are unchanged.
- **AC-7** End screen shows the exact item count, % and minutes for a known sequence.
- **AC-8** Dashboard "Tiếp tục học" points to `/review` with the right counts when there is work, else to `continueHref(last)`.
- **AC-9** E2E on mobile + desktop, axe clean, no console errors, no :4000 calls.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1, AC-2 | `src/lib/activity.test.ts` (UTC instants, midnight boundary) | Vitest |
| AC-3 | `src/lib/library.test.ts` `currentLesson`, `stopsOf` | Vitest |
| AC-4 | `src/lib/daily.test.ts`, `src/lib/store.test.ts` | Vitest |
| AC-5, AC-6, AC-7 | `src/app/review/ReviewApp.test.tsx` | RTL |
| AC-8 | `src/lib/daily.test.ts` (`continueTarget`) | Vitest |
| AC-5, AC-8, AC-9 | `e2e/daily.spec.ts` | E2E |

## §7.2 case groups
- Boundaries: midnight VN (16:59:59Z / 17:00:00Z); budget 0, exactly `NEW_PER_DAY`, more than `NEW_PER_DAY` learned; lesson with fewer new items than the budget.
- Empty: no content stops → no fresh, existing empty panels.
- Broken/old data: unreadable `kotoba.daily.v1` → 0; activity days stored before this change keep loading.
- Storage blocked: count lives nowhere → budget stays full (accepted; deck warning already shown).
- Concurrency: two tabs each read-modify-write the list on every grade; a lost id only allows one extra new item.
- Time: day rollover resets the count; browser in another zone uses VN days.
- Persistence: reload keeps the count (E2E reopen).
- Navigation: `/review?weak=0` = daily; filtered queues unchanged.
- Keyboard & a11y: no new controls; end stats inside the existing `role="status"` panel.
- Display: stats line wraps at 360px.
- Large data: N/A (≈800 items, linear filters).

## Self-review notes
- `reviewer`: PASS (no Critical/High). Fixed after review: added the AC-6 `lesson` queue case and a `Dashboard.test.tsx` for due > 0 and the no-work fallback (seen failing with `continueTarget(0, 0, …)`); the comment on the deliberate catch in `store.review` now says why (ADR 004); `isDaily` naming; the e2e imports `NEW_PER_DAY`; ADR 004 notes the sign-out reset. The x-forwarded-for pass-through and the dashboard/`/review` due-count mismatch go to BACKLOG.
- `e2e/lapses.spec.ts`: `/review?weak=0` used to assert the empty text; phase 18 makes any non-`1` weak value a plain `/review`, i.e. today's session, so it now expects the 10 new kana of lesson 1. A behaviour change from this spec, not a loosened test.
- `e2e/daily.spec.ts` sets its own `x-forwarded-for`: kotoba-be allows 10 sign-ups per IP per hour and the existing specs already use them.
- The new-items count is not taken from `summarize(activity).today` as the roadmap suggested, because that counts reviews too (ADR 004).
- Kept: test helpers read the card front by the `#review-front` id, like the phase 17 tests.
