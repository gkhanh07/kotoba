# Task: keep stored data when it cannot be read or written

Source: `docs/plan/PLAN.md` "Trước 28: giữ an toàn dữ liệu lưu"; BACKLOG "Empty `catch {}`". Bug: BUG-013. Decision: ADR 008.

- Goal: a broken or full localStorage never costs a learner the data that is still there.
- In scope: `lib/store.ts`, `lib/activity.ts`, the caller of `applyRemote` in `app/Sync.tsx`.
- Out of scope: repairing a broken copy, any UI to download it, the daily counter (ADR 004 made it bookkeeping).
- Stored data: one new optional key per stored key, `<key>.broken`. No existing shape changes, so `schemaVersion` stays (ADR 002).

## What goes wrong today

| Place | Today | Effect |
|---|---|---|
| `read()` + `write()` | Broken SRS gives an empty deck; the next grade overwrites the original | Whole deck gone, no copy |
| `logActivity` | Broken log → `{ days: {} }`, then written over it | Study history gone, no copy |
| `syncState` | Any damage → defaults | Readable `owner` and `forget` dropped: other accounts' data counts as a guest merge, resets come back |
| `resetDeck` | A failed `forget` write is ignored, the deck is reset anyway | The account keeps the cards and the next pull restores them |
| `applyRemote` | Three writes; a failure leaves some done | One account's cards with another's activity and owner |
| `clearLocal` | Empty catch | Nothing reported |

## Acceptance criteria

- AC-1. Given a broken stored SRS, when the deck is written, then the broken text is in `kotoba.srs.v1.broken` first. If that copy cannot be saved, the original stays and the deck is `ok: false`.
- AC-2. Given a broken activity log, when an action is logged, then the broken text is copied first. If the copy fails, the original stays.
- AC-3. Given unparseable sync data, when it is read, then the text is copied and defaults are returned.
- AC-4. Given sync data with some valid fields, when it is read, then `owner` and every valid `forget` entry survive and `lastSync` is 0, so the next push resends everything rather than too little.
- AC-5. Given a signed-in learner and a `forget` entry that cannot be saved, when a set is reset, then the deck does not change and is `ok: false`, so the warning shows.
- AC-6. Given a write failure part way through `applyRemote`, then all keys hold their old values, it returns false, and the status shows the sync as failed.
- AC-7. Given sign-out, then the `.broken` copies go too.
- AC-8. Given a second broken copy, then the first stays (it is the closest to what was lost, and `read()` runs on every render).
- AC-9. No empty `catch {}` remains in `store.ts` or `activity.ts`. A deliberate one says why.

## Test matrix

| AC | Test | Layer |
|---|---|---|
| AC-1 | `store.test.ts` › broken deck | Unit, real jsdom storage |
| AC-2 | `activity.test.ts` › corrupt log | Unit |
| AC-3, AC-4 | `store.test.ts` › syncState | Unit |
| AC-5 | `store.test.ts` › resetDeck | Unit |
| AC-6 | `store.test.ts` › applyRemote; `SyncStatus.test.tsx` | Unit, component |
| AC-7 | `store.test.ts` › clearLocal | Unit |
| AC-8 | `store.test.ts` › broken deck | Unit |
| AC-9 | Reviewed by grep in the gate | n/a |

Broken data: `kotoba-fe/tests/fixtures/storage.broken.json`.

§7.2 N/A: display (no new text), keyboard, large data (the extra parse runs only on a deck already marked not ok, or once per pull), time (no new clock use). Two tabs: `.broken` keeps the first copy, so a second tab cannot replace it.

## Steps

1. BUG-013, this spec, ADR 008 → verify: docs written.
2. Fixture and failing tests → verify: seen failing.
3. `lib/broken.ts`, `store.ts`, `activity.ts`, `Sync.tsx` → verify: unit and component tests green.
4. Quality Gate, commit `fix(store):`, push, PROGRESS, BACKLOG.

## Self review

- `isForget` first checked only that `at` was finite, while the API also needs `at > 0`. An entry with `at: 0` would have made every later push fail with 400. Fixed, with a test and a fixture entry (`syncBadForgetTime`).
- Tests that were already green before the fix cannot show they test anything, so each got a mutation (§7.4). That exposed two weak tests: "makes no copy of a readable log" ran on empty storage, and "leaves a corrupt log in place" made every write fail, so it passed with the copy removed. Both tightened; all 5 mutations now fail a test.
- No E2E seeds broken storage, so the new `console.error` does not trip the E2E fixture.
- Found, not fixed: see BACKLOG "A reset during a push".
