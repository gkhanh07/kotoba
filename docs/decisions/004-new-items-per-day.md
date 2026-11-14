# ADR 004: Count of new items learned today, kept per browser

- Status: accepted
- Date: 2026-11-03

## Context
Phase 18's daily session brings in at most `NEW_PER_DAY` new items per study day, minus the new items already learned that day. The roadmap suggested taking that count from `summarize(activity).today`, but that counts every item *touched* today (reviews included): a learner who reviews 20 due cards would get no new items at all. Neither the SRS card (`box`, `due`, `at`, `lapses`) nor the activity log records when an item was first seen.

## Options
1. `summarize(activity).today` as in the roadmap (counts reviews too: wrong number).
2. Infer from cards (touched today and box ≤ 1): also counts relearned lapses.
3. A new field on cards or activity days, synced through kotoba-be: needs a Prisma migration and a merge rule; kotoba-be's activity merge drops unknown day fields today.
4. A small per-browser record `kotoba.daily.v1 = { day, ids }`: `store.review()` adds an id when the deck had no card for it.

## Decision
Option 4. The record is pure bookkeeping (losing it only allows a few extra new items), so it is not part of the inviolable progress data: an unreadable value or another day counts as 0 and is replaced on the next write; `clearLocal()` removes it on sign-out; it is not synced and `applyRemote()` leaves it alone.

## Consequences
- Exact count of first-time items per study day on one device, from every page that grades (review, flashcards, kana quiz).
- Two devices on the same day each allow `NEW_PER_DAY` (accepted). Two tabs can lose one id in a race, allowing one extra new item (accepted).
- Signing out removes the record, so signing out and back in on the same day allows another `NEW_PER_DAY` (accepted).
- If cross-device limits are needed later, move to option 3 with a `firstSeen` day on the card (additive field, ADR 002).
