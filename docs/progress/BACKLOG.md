# Backlog

Out-of-scope findings (AGENTS.md §2, §13). Not fixed in the task that found them.

## Rule deviations in existing code (found in Task A, 2026-11-03)

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
- Vocab ids are `vocab:<word>` with `word` in kana when the kanji is above the level, so homophones collide and could not be added: 紙/髪 (かみ), 風邪/風 (かぜ), 橋/箸 (はし), 吹く/服 (ふく), 取る/撮る (とる), 切る/着る (きる), 厚い/暑い (あつい), 弾く/引く (ひく), 十 read とお; N3 batch 28a also skipped 掃く, 拭く, 揚げる, 煮る, 風邪, 咳, 肩, 恋; 28c skipped 贈る, 泊める, 留める, 振る, 貼る, 張る, 駆ける, 包装 and 開く read ひらく (its id is taken by あく), and 取る/切る still exist at no level. Needs an id scheme for same-kana words (decision + `be` change; existing ids must stay).
- Batch 15a words to confirm as N5 (not N4): ごしゅじん, いや, りっぱ, なく (鳴く), だれか, どこか, おおぜい, さらいしゅう, さらいねん, ペット, せっけん, おしいれ, ストーブ, ごろ. Also review `vocab:すく` (written in kana), `vocab:そば` (側 vs 蕎麦), `vocab:七つ` (example uses "seven years old").

## Phase 18 follow-ups
- `kotoba-fe/src/lib/auth.ts:21-25` forwards the client's own `x-forwarded-for` to kotoba-be's rate limiter, so a client facing Next directly can pick its IP (already flagged "ponytail"). `e2e/daily.spec.ts` relies on it to get its own sign-up allowance.
- Dashboard due counts every card in the stored deck; `/review` only items that exist in content. A leftover card id would show "1 đến hạn" with an empty queue (predates phase 18; now also decides where "Tiếp tục học" goes).
- Possible flake: `e2e/test.spec.ts:109` (full n5-1 run, desktop) hit the 30 s test timeout inside `axe()` once on a slow run (3.4 min suite); the rerun passed 52/52. Watch it; if it recurs, give that test a longer timeout or split its axe scans.

## Phase 22 follow-ups
- `GET /content/:kind?page=` pages in memory after the field filters (reads the whole kind + level each call, ~12 ms at 5,000 rows). Use `skip/take` in SQL when no field filter is set if lists grow further.
- `/vocab` "Ôn n từ đến hạn" counts due words of the selected level, but the link `/review?kind=vocab` reviews every level, so the numbers differ once N4 words exist. Decide in phase 23/24: pass `level` to the review queue or count all levels.
- The kanji page builds `filter&level` for tabs and `level&filter&page` for the pager: two URL spellings of the same state (cosmetic).
- Deploy notes (phase 35): after a kotoba-be content change, clear kotoba-fe's `.next/cache/fetch-cache` (or wait an hour) — see BUG-005.
- Kanji Hán Việt from KANJIDIC2 that look off and are kept as the source has them: 県 "Huyền" (usually "Huyện"), 着 "Khán" (usually "Trước/Trứ"). Decide whether an authored `hvFix` field is worth it.

## Phase 26 follow-ups
- Mock test passages: line breaks in `passage` (title, paragraphs) are not kept on screen, so the N4 `text` passage reads as one block. Render `\n` as paragraph breaks in TestApp (and check n5-1's memo passages).
- N4 content not yet seen by a reviewer pass: grammar (phase 25) and paper n4-1 (phase 26); all `reviewed: false`.

## A reset during a push (found in the store hardening task, 2026-11-05)
A reset of a set with no local cards, made while a push is in flight, leaves `snapshot()` unchanged, so `applyRemote` writes `forget: []` and drops the entry. The account keeps those cards. Needs a reset of an empty set inside one request; the next reset of that set sends it again.

## Hán Việt source task follow-ups (2026-11-08)
- AC-1 of `docs/tasks/hanviet-fix.md` (every `hv` is in hanviet-pinyin-wordlist) was checked by a scratchpad script, not a repo test, because the list and Unihan variants are not vendored. Vendor a trimmed list (MIT allows it) and turn the check into a `validate:content` step before N2 kanji are added.
- A kanji with no `hv` (only 込 today) renders an empty `hv` span in kanji tiles: `kanji/[char]/page.tsx` (look-alikes), `vocab/[word]/page.tsx`, `KanjiGrid.tsx`, `lessons/[n]/page.tsx`. Invisible, but an empty node; render the span only when there is a reading.
- A kanji with no on reading (込) shows an empty "Âm On" row on its page; show a dash or leave the row out.
- The site footer credits "Dữ liệu kanji: KANJIDIC2" only; since ADR 009 the Hán Việt readings come from hanviet-pinyin-wordlist, which only the legal page credits.

## Sample review round 2 notes (2026-11-09, not errors)
- `grammar:baai-wa`: add the adjective forms `A-い + 場合は` and `A-な + な場合は`.
- `grammar:you-ni-naru`: add the negative `V-ない + ようになる` (たばこを吸わないようになりました).
- `n4-1` question 5.4 (usage): the explanation would read more naturally as `パン作りに失敗した` than `パン作りが失敗した`; the answer is unaffected.
- Kanji cards list every on/kun and Hán Việt reading from the sources, including rare ones (米 メエトル, 数 サク・ソク・シュ). Show the common readings first and fold the rare ones away.
