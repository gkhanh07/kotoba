# Backlog

Out-of-scope findings (AGENTS.md §2, §13). Not fixed in the task that found them.

## Rule deviations in existing code (found in Task A, 2026-11-03)

### Empty `catch {}` (AGENTS.md §5.4; the ban applies to new code)
- `kotoba-fe/src/lib/activity.ts:63`
- `kotoba-fe/src/lib/store.ts:77`
- `kotoba-fe/src/lib/store.ts:99`
- `kotoba-fe/src/lib/store.ts:109`
- `kotoba-fe/src/lib/store.ts:117`

Each should either handle the error (e.g. mark the deck as `ok: false`) or report it, without overwriting stored data.

### Business constants not yet in `src/config/` (AGENTS.md §5.3)
- `kotoba-fe/src/lib/srs.ts`: `INTERVALS` (Leitner days 1/3/7/14/30) and `KNOWN_AT`.
- Other constants found later go here too. New constants go straight to `kotoba-fe/src/config/` or `kotoba-be/src/config.ts`.

### Docs
- README does not yet credit the JMdict/KANJIDIC2 sources and the EDRDG licence (AGENTS.md §12). `kotoba-be/README.md` is still the Nest starter text. Planned for phase 35.

### BE coverage below 90%
- See PROGRESS.md "Baseline" for the measured BE unit coverage. Controllers, `validate.ts`, `db.ts`, `mailer.ts` and `main.ts` are only exercised by the supertest e2e suite, which is not counted. Raising unit coverage of `src/` to 90% is backlog; the threshold in `kotoba-be/vitest.config.ts` may only be raised.

## Phase 14 follow-ups
- `kotoba-fe/src/app/test/error.tsx` has no automated test (BE down while loading `/test`).
- `TestApp` ←/→ call `preventDefault` whenever focus is outside an input, which overrides horizontal scrolling by arrow keys (AGENTS.md §8.1, minor).
- `e2e/test.spec.ts` uses non-null `!` in four places (test-only).

## Content (phase 15)
- Vocab ids are `vocab:<word>` with `word` in kana when the kanji is above the level, so homophones collide and could not be added: 紙/髪 (かみ), 風邪/風 (かぜ), 橋/箸 (はし), 吹く/服 (ふく), 取る/撮る (とる), 切る/着る (きる), 厚い/暑い (あつい), 弾く/引く (ひく), 十 read とお. Needs an id scheme for same-kana words (decision + `be` change; existing ids must stay).
- Batch 15a words to confirm as N5 (not N4): ごしゅじん, いや, りっぱ, なく (鳴く), だれか, どこか, おおぜい, さらいしゅう, さらいねん, ペット, せっけん, おしいれ, ストーブ, ごろ. Also review `vocab:すく` (written in kana), `vocab:そば` (側 vs 蕎麦), `vocab:七つ` (example uses "seven years old").

## Phase 18 follow-ups
- `kotoba-fe/src/lib/auth.ts:21-25` forwards the client's own `x-forwarded-for` to kotoba-be's rate limiter, so a client facing Next directly can pick its IP (already flagged "ponytail"). `e2e/daily.spec.ts` relies on it to get its own sign-up allowance.
- Dashboard due counts every card in the stored deck; `/review` only items that exist in content. A leftover card id would show "1 đến hạn" with an empty queue (predates phase 18; now also decides where "Tiếp tục học" goes).
- Possible flake: `e2e/test.spec.ts:109` (full n5-1 run, desktop) hit the 30 s test timeout inside `axe()` once on a slow run (3.4 min suite); the rerun passed 52/52. Watch it; if it recurs, give that test a longer timeout or split its axe scans.

## Phase 22 follow-ups
- `GET /content/:kind?page=` pages in memory after the field filters (reads the whole kind + level each call, ~12 ms at 5,000 rows). Use `skip/take` in SQL when no field filter is set if lists grow further.
- `/vocab` "Ôn n từ đến hạn" counts due words of the selected level, but the link `/review?kind=vocab` reviews every level, so the numbers differ once N4 words exist. Decide in phase 23/24: pass `level` to the review queue or count all levels.
- The kanji page builds `filter&level` for tabs and `level&filter&page` for the pager: two URL spellings of the same state (cosmetic).
