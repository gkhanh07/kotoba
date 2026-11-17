# ADR 014: XP derived from SRS cards

- Status: accepted (reverses the "no XP" non-goal for a personal level only; no leaderboards, no friends)
- Date: 2026-11-15

## Context
The user asked for XP and personal levels. PLAN proposed XP from the activity log (10 × right answers + 5 × new items + 30 per lesson). The activity log is trimmed to 90 days (`KEEP_DAYS`), so XP built from it would fall as old days drop off. Storing an XP counter adds data that can drift from what was actually learned and needs its own sync.

## Decision
XP is computed, never stored: `xpOf(srs) = XP_PER_BOX × Σ box + XP_PER_CARD × cards` (10 and 5); `XP_PER_LEVEL` = 260 (`src/config/xp.ts`). The per-lesson bonus is dropped: the top bar would need the whole content list on every page.

## Consequences
- XP measures what is remembered now. A missed card drops to box 0, so XP can go down; the results screen shows the session change with its sign rather than hiding it.
- No new storage, no migration, no sync change (ADR 002 unaffected).
