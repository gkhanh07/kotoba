# Phase 30: N3 mock test N3-1

Roadmap: `docs/plan/PLAN.md` "27–30. N3" ("Đề N3-1 `minutes: 100`"). Rules: `AGENTS.md` §12. Same shape and process as phase 26 (`docs/phases/26-n4-mock-test.md`).

## Goal
An N3 paper with the real exam's sections and a 100-minute clock (vocabulary 30 + grammar/reading 70, one clock as for N5/N4). Results stay practice only (no pass/fail, already shown on the result screen).

## Scope
- **Content.** `tests.json` paper `n3-1`: `level: 3`, `minutes: 100`, `reviewed: false`, title {vi: "Đề thi thử N3 số 1", en: "N3 mock test 1"}. Parts in exam order, question counts of the real N3 paper (jlpt.jp sample structure), using only the existing part types:
  - 文字・語彙: `kanji` 8, `writing` 6, `context` 11, `paraphrase` 5, `usage` 5;
  - 文法: `grammar` 13, `order` 5 (★), `text` 5 (one passage, blanks （１）…（５）);
  - 読解: `reading` 16 over 8 passages: short 4 passages × 1, medium 2 passages × 3, long 1 passage × 4, information retrieval 1 passage × 2.
  Total 74 questions. Content from N5–N3 only: every kanji in a question, choice or passage is in `kanji.json` (level 5, 4 or 3), others in kana, except the wrong choices of a `writing` question, which are look-alike kanji on purpose as in the real exam; words mostly from `vocab.json`. Plausible distractors; answers spread roughly evenly over 0–3; every question has a Vietnamese `explain`. Grammar questions test N3 points in `grammar.json` where possible.
- **content.spec.ts.** N3 blueprint (above) added to `BLUEPRINT`; paper levels pinned to [3, 4, 5]; every kanji in a paper is in `kanji.json` at the paper's level or easier.
- **FE.** No new part type, so no label change. E2E `e2e/test-n3.spec.ts`: `/test?level=3` lists N3-1; a full run with a known answer pattern shows the exact headline and per-part rows.

Out: new part types (listening is not part of the app), pass/fail with section minimums.

## Acceptance criteria
- **AC-1** `validate:content` passes with the N3 blueprint check; 100 minutes; every question has `explain`; every kanji at level ≤ N3.
- **AC-2** `/test?level=3` lists N3-1; a full run shows exact per-part scores (E2E answers a known pattern).
- **AC-3** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass; screenshots of the N3 intro, a `reading` question with a long passage and the result at 360 and 1440 looked at.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/content/content.spec.ts` | Vitest |
| AC-2 | `kotoba-fe/e2e/test-n3.spec.ts` | E2E |
| AC-3 | full suites, manual screenshots | all |

## §7.2 case groups
Content: happy path, wrong data (blueprint, explain, kanji level), display (long passages at 360). Timer, persistence, navigation: unchanged code paths from phase 14, covered there. Concurrency, storage, time zone: N/A (static content).

## Self-review notes
- The paper kanji test first failed on `n5-1`: its `writing` questions use look-alike kanji as wrong choices on purpose (体/伏/付/広/庄/応/石/在/両/雪/続), as the real exam does. Wrong `writing` choices are exempt; the answer is still checked. Seen failing with 鑑賞 inserted into `n3-1`, then reverted.
- English title aligned with N4: "N3 mock test 1" (the draft said "practice").
- The BE e2e pins the `/tests` list; `n3-1` added there.
- BE coverage ratchet: measured 30.57/35.59/33.96/30.06 (no `src/` change in this phase), so the rounded-down values equal the thresholds already set (30/35/33/30); no change. A first reading of 33/43/45/32 was wrong and was reverted after `npm run check` failed on it.
- Codex review (read-only) found: question 49 (`order`) had a second valid order (先生の 問題を 説明の とおりに), so ★ was ambiguous: rebuilt as 先生が 説明した とおりに 難しい 問題 を; question 26 (`paraphrase`) paired 相変わらず with a 〜と comparison: rewritten as この 町は 相変わらず 静かだ; `grammar:beki-da` said べきだ is never used for legal duties: softened to "なければ ならない is usual for stating a legal obligation". It also asked to check every `writing` choice; kept the exemption (deliberate look-alikes) and wrote it into the spec above instead of an id allowlist.
- `scripts/sample.ts` gains the N3 vocab, grammar and paper sections at the end, so old seeds replay unchanged (checked with 20261105).
