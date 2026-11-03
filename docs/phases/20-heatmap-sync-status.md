# Phase 20: study heatmap and sync status

Roadmap: `docs/plan/PLAN.md` §20. Rules: `AGENTS.md`. Chart method: the `dataviz` skill (sequential = one hue, scale legend, text alternative).

## Goal
The dashboard shows 13 weeks of study at a glance. A signed-in learner always knows whether their progress reached the account.

## Scope
In: pure `heat(activity, today)` in `src/lib/activity.ts`; a heatmap block on the dashboard; a small sync-status store in `src/lib/store.ts`; a status line in `SiteBar` for signed-in users with a retry.
Out: changing what or when `Sync` pushes; per-hour charts; BE changes.

## Behaviour
- **`heat(a, today)`** (`today` = study day key, ADR 003). Columns are weeks Monday → Sunday; the last column holds `today`; 13 columns. Cells after `today` are `null` (not drawn). Each cell `{ day, minutes, level }`, minutes = `a.days[day]?.minutes.length ?? 0`. Levels from `HEAT_LEVELS = [1, 10, 20, 40]` (`src/config/activity.ts`): 0 = 0 min, 1 = 1–9, 2 = 10–19, 3 = 20–39, 4 = ≥ 40. Also returns `activeDays` and `totalMinutes` over the drawn cells. The first drawn day is at most 90 days back, inside `KEEP_DAYS`.
- **Heatmap block** ("Hoạt động 13 tuần"): a grid of 7 rows × 13 columns. Level 0 is Wet with a Faint Rule border; levels 1–4 are amber mixed into Night at 40/62/82/100 % (dataviz `validate_palette.js --ordinal` passes against both Night and Wet) (one hue, dark → bright, the dataviz sequential rule in a dark theme). Each cell is `role="img"` with `aria-label` and `title` "d/m: n phút". A visible summary line: "x ngày có học · y phút trong 13 tuần". A scale legend: "Ít" + the five swatches, each with its range as text ("0", "1–9", "10–19", "20–39", "40+" phút) + "Nhiều". Weekday labels T2, T4, T6 on the left. The existing "Gần đây" list stays as the table view.
- **Sync status.** `store.ts` keeps a `SyncPhase` (`idle | syncing | failed`) behind `useSyncExternalStore`; `Sync.flush` sets `syncing` before each push and `idle`/`failed` after it, always as a new snapshot so readers re-render after every push. The `syncProgress` server action now returns `{ failed: true }` when kotoba-be cannot be reached (logged on the Next server) instead of throwing, so the browser gets a normal response, not a 500, and `Sync` treats it as a failed push; `{ failed: false, remote }` otherwise. `pendingCount(srs, st, owner)` = cards a push would send (all cards on the first sync, cards with `at > lastSync` otherwise, plus queued forgets; 0 for a foreign owner). The `SyncStatus` client component (rendered by `SiteBar` only when signed in) shows, in Dim Silver, inside `aria-live="polite"`:
  - failed → "Lỗi đồng bộ" + a "Thử lại" button that pushes again;
  - else pending n > 0 → "Chờ lưu n thay đổi";
  - else a push in flight → "Đang lưu…" (the retry button is gone meanwhile, so it cannot queue twice);
  - else "Đã lưu".
  Before the deck loads it shows nothing.

## Acceptance criteria
- **AC-1** `heat` builds 13 Monday-first columns ending on the week of `today`, nulls after today, exact minutes and levels at every threshold (0, 1, 9, 10, 19, 20, 39, 40), across a month and year boundary.
- **AC-2** Dashboard heatmap: cell labels, summary line and legend show the exact values from a fixture.
- **AC-3** `pendingCount` returns the right count for first sync, later sync, forgets and a foreign owner.
- **AC-4** `SyncStatus`: "Đã lưu", "Chờ lưu n thay đổi", "Lỗi đồng bộ · Thử lại"; Thử lại calls a new push; hidden for guests.
- **AC-5** E2E: signed in, study one card → "Đã lưu"; stop kotoba-be → study → "Lỗi đồng bộ"; start it again → "Thử lại" → "Đã lưu". Axe clean.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `src/lib/activity.test.ts` `heat` | Vitest |
| AC-2 | `src/app/Heatmap.test.tsx` | RTL |
| AC-3 | `src/lib/store.test.ts` `pendingCount` | Vitest |
| AC-4 | `src/app/SyncStatus.test.tsx`; guests: `e2e/sync-status.spec.ts` | RTL / E2E |
| AC-5 | `e2e/sync-status.spec.ts` (stops and restarts the real BE) | E2E |

## §7.2 case groups
- Boundaries: thresholds; today on a Monday (1 drawn cell in the last column) and on a Sunday (7); month/year rollover.
- Empty: no activity → all level 0, summary "0 ngày có học · 0 phút".
- Broken data: unreadable activity → dashboard already falls back to an empty log with its warning.
- Network: BE down → failed status; retry after it is back.
- Concurrency: retry while a push is in flight queues behind it (existing `chain`).
- Time: day keys only (ADR 003).
- Persistence: the failed flag is per tab and in memory; a reload tries again on mount.
- Keyboard & a11y: Thử lại is a real button; status in `aria-live="polite"`, not announced per second; heatmap has text labels and a summary.
- Display: the grid fits 360px (13 columns of 14px cells); legend wraps.
- Large data: N/A (91 cells).

## Self-review notes
- `reviewer`: BLOCK on the first pass, fixed:
  - High: after a successful push whose reply equalled the local cards byte for byte, nothing re-rendered and the line stayed on "Chờ lưu n thay đổi". The boolean `syncFailed` became the `SyncPhase` union, set before and after every push as a new snapshot. Regression test in `SyncStatus.test.tsx` (seen failing with the old notify-on-change behaviour).
  - Medium: retry while kotoba-be is still down gave no feedback; now the line goes "Đang lưu…" then back to "Lỗi đồng bộ", and the button is absent while a push is in flight.
  - Low: `!` in a test, `13` in the heatmap strings (now `HEAT_WEEKS`), `e2e/backend.ts` only signals kotoba-be's own `dist/main` process and names its poll constants, README notes the `lsof` / built-dist need, matrix lists the guest e2e.
- First pass of the E2E also found two real issues: on phones the status sat inside the closed menu popover (moved into the bar itself; the brand no longer shrinks), and a failed push surfaced as a 500 console error (the action now returns `{ failed }`).
- Palette: the first ramp (30% amber for level 1) failed the dataviz ordinal light-end check at 1.87:1 on Night; 40/62/82/100% passes against Night and Wet.

