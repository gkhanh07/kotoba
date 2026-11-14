# Task: Hán Việt readings from a checked source, and the round-1 sample errors

Source: BUG-009 (open since phase 27) and the first content sample sheet (seed 20261105), which found BUG-014, BUG-015, BUG-016. Decision: ADR 009.

- Goal: every kanji card shows a Hán Việt reading a Vietnamese learner would find in a dictionary, and the sample errors are fixed before the user reviews the sheet.
- In scope: `kanji.json` `hv` and 中 `on`, `vocab:すく`, `grammar:shieki`, `scripts/kanjidic.ts`, how the FE shows a kanji without `hv`, the legal credits, the sample sheet.
- Out of scope: `vi` meanings of kanji (reviewed through the sheet), new content, phase 28.
- Stored data: none. Progress stores ids, never `hv`, and no id changes.

## Acceptance criteria

- AC-1. Given `kanji.json`, then every `hv` of every kanji is in hanviet-pinyin-wordlist (through Unihan variants or the shinjitai map), or is one of the 6 documented KANJIDIC2 readings (ADR 009).
- AC-2. Given the readings the review named (画, 顔, 県, 変, 断, 横, 戦, 伝, 払), then they show the corrected values.
- AC-3. Given a kanji other than 込, then it has at least one `hv`; 込 has none.
- AC-4. Given `npm run kanjidic`, then `kanji.json` is regenerated identically (authored `hv` and `EXTRA_ON` kept).
- AC-5. Given `/kanji/込`, then the page says it is a Japanese-made kanji with no Hán Việt reading, and the title is "込 · Kotoba"; on the review card no empty Hán Việt row shows.
- AC-6. Given `/kanji/画`, then the title is "画 · Họa, Hoạch · Kotoba".
- AC-7. Given 中, すく and shieki, then they match BUG-014/015/016's fixes.
- AC-8. Given the legal page, then Hán Việt is credited to hanviet-pinyin-wordlist (MIT) in vi and en.
- AC-9. Given the sample sheet, then the kanji sections are redrawn after the fix, the others keep their seed, and the round-1 errors are noted.

## Test matrix

| AC | Test | Layer |
|---|---|---|
| AC-1 | Scratchpad check over all 625 kanji (618 ok, 6 documented, 込 empty); not kept in the repo since the list is not vendored, so it is not repeatable (BACKLOG). `content.spec.ts` "stores Hán Việt readings in NFC with the list spelling" locks NFC and 姉 Tỷ | manual script, content |
| AC-2 | `content.spec.ts` "keeps the Hán Việt readings the review corrected…" | content |
| AC-3 | `content.spec.ts` "gives every kanji a Hán Việt reading, except the Japanese-made ones" | content |
| AC-4 | `npm run kanjidic` then `git diff` of `kanji.json` is empty against the authored file | manual |
| AC-5 | `library.test.ts` `hvRows`, `kanjiTitle`; `e2e/vocab-page.spec.ts` /kanji/込 | unit, e2e |
| AC-6 | `library.test.ts` `kanjiTitle`; `e2e/vocab-page.spec.ts` /kanji/画 | unit, e2e |
| AC-7 | `content.spec.ts` BUG-014, BUG-015, BUG-016 | content |
| AC-8 | Read in the diff (static text) | review |
| AC-9 | `npm run sample`, reproducible with `scripts/sample.ts` | review |

§7.2 groups: empty (込 with no `hv`) covered; boundaries, time, concurrency, persistence and storage are N/A (static content, no state).

## Self review

- The scratchpad check first missed quoted multi-reading rows and NFC/tone-placement differences (hoà/hòa, -y/-i); fixed before trusting its counts.
- Readings in the list but not useful to learners (予 Dữ, 説 Thuế, 万 Mặc, 未 Mùi) were left out on purpose; recorded in ADR 009 for the user to judge.
- The first sheet note said 中 had left the kanji sample; it is still in the redrawn N5 sample, so the note was corrected.
- Review (reviewer agent, PASS, no Critical/High): fixed here: ADR 009 now states the rule and lists all 196 dropped readings in 137 kanji (the first draft named only the 4 in the list); 姉 back to Tỷ as the list spells it, and all `hv` stored in NFC (37 were decomposed, from KANJIDIC2), with a test; `EXTRA_ON` deduplicated; the sr-only "(Hán Việt)" no longer follows the no-reading note; the en note reads "Japanese-made kanji: no Hán Việt reading"; すく vi has no Japanese inside ("đói (bụng); …"); DESIGN.md describes the no-reading state; the 込 e2e test runs axe. To BACKLOG: AC-1 automation, empty `hv` spans in tiles.
