# ADR 007: "đã học", "đã thuộc" and the goal's scope

- Status: accepted
- Date: 2026-11-05

## Context
The landing page promised that an item counts after three correct answers in a row, while the app counts "learned" at box ≥ 1 and "known" at `KNOWN_AT` (6). One correct review showed "Kana Đã học 2 / 224" (critique of `/`, 2026-11-04). Separately, the dashboard divided by every level's content, whatever the learner's goal (BUG-012).

## Options
- Terms: (a) raise "learned" to `KNOWN_AT` everywhere, which empties lesson meters and changes what a new item is in the daily session; (b) keep both levels of the code and name each one on every surface.
- Scope: (a) only the goal's own level, as the critique worded it; (b) the goal's level and every easier one.

## Decision
- **Đã học / Learnt** = box ≥ 1: answered right at least once (`isLearned`). The dashboard table and lesson meters use it.
- **Đã thuộc / Known** = box ≥ `KNOWN_AT`: 6 reviews right in a row, spaced by `INTERVALS` (1, 3, 7, 14, 30 days). A miss goes back to box 0 (`isKnown`, `apply`). Drilling early does not raise the box. The landing page's lamps show this.
- The word "nhớ" no longer names a state.
- **Goal scope is cumulative** (`goalScope` in `lib/library.ts`): N5 → N5; N4 → N5+N4; N3 → N5–N3. JLPT is cumulative and lessons run through the levels, so an N4 learner still has N5 to finish. No goal, N2 or N1 (no such content) → everything. Kana has no scope: every goal needs all of it.

## Consequences
- Dashboard numerators and denominators come from one id list, so a numerator cannot exceed its total. Cards of other levels stay stored and scheduled: only the table stops counting them.
- Due counts stay across all levels, because the review queue covers all levels.
- The landing copy takes `KNOWN_AT` and `INTERVALS` as arguments, so a change to the schedule changes the sentence too.
