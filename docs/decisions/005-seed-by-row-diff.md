# ADR 005: Seed content by row diff; paged lists report at least one page

- Status: accepted
- Date: 2026-11-03

## Context
kotoba-be re-seeds the `Item` table from `content/*.json` on every boot. Phase 22 measured it: ~0.75 s for today's ~1,080 rows, ~5.5 s for 10,480 rows (N2-sized content) once BUG-004 was fixed. The roadmap's threshold was ~2 s, with "seed only when the content hash changes" as the suggested fix. Phase 22 also adds `?page=` to `GET /content/:kind`.

## Options
1. Keep rewriting every row on boot (5.5 s at 10k).
2. Hash gate: store a hash of the JSON, skip the seed when unchanged. Needs a table or file for the hash, and misses changes in code that derives columns (`searchText`, `normalize`) while the JSON stays the same.
3. Row diff: read the table once, compare each row's columns (kind, lesson, level, sort, search, data) with what the JSON gives, upsert only rows that differ, delete rows whose id left the JSON.

## Decision
Option 3. No new table or migration; a change in derived columns is caught because the comparison is on the computed row. Card → Item stays `Restrict`, so removing an item someone has a card for still fails the boot.

Paged lists: `{ items, page, pages, total }` with `pages = max(1, ceil(total / PAGE_SIZE))`, so an empty level answers page 1 with `items: []` (the FE shows its empty state) and "page > pages" is the single 404 rule.

## Consequences
- Boot with unchanged content: ~75 ms at 1,080 rows, ~196 ms at 10,480 rows. A full rewrite (empty DB or every row changed) still takes ~5.5 s at 10k, once.
- Paging is done in memory after the field filters (script/group/topic), ~12 ms a page at 5,000 rows; moving it to `skip/take` in SQL is in BACKLOG.
