# Phase 26: N4 mock test N4-1, and moving on from N5

Roadmap: `docs/plan/PLAN.md` "26. Đề thi thử N4-1" and its extra check. Rules: `AGENTS.md` §12.

## Goal
An N4 paper with the real exam's sections and an 80-minute clock, and proof that a learner who finishes N5 is led into N4.

## Scope
- **Content.** `tests.json` paper `n4-1`: `level: 4`, `minutes: 80` (vocabulary 25 + grammar/reading 55, one clock as for N5), `reviewed: false`, title {vi, en}. Parts in exam order, question counts as the real N4 paper (jlpt.jp sample structure):
  - 文字・語彙: `kanji` 7, `writing` 5, `context` 8, `paraphrase` 4, `usage` 4 (new part type: pick the sentence where the underlined word is used correctly; the word is in `{…}`);
  - 文法: `grammar` 13, `order` 4 (★), `text` 4 (a passage with numbered blanks; new part type);
  - 読解: `reading` short (4 passages × 1), medium (1 passage × 3), information retrieval (1 passage × 2).
  Content from N5/N4 only (kanji and words in the JSON at level 5/4), plausible distractors, every question with a Vietnamese `explain`.
- **content.spec.ts.** Each paper's part counts per type match its level's blueprint (N5 as today, N4 as above); `usage` questions have `{…}`; `text` parts have a passage.
- **FE.** Part labels for `usage` ("Cách dùng từ" / "Word usage") and `text` ("Ngữ pháp theo đoạn văn" / "Text grammar") in `src/lib/testText.ts`. `lib/test.ts` already groups by part.
- **N5 → N4.** E2E: a guest whose deck has every N5 item learned (seeded with `page.addInitScript`) gets today's `/review` session from lesson 26 ("Mục đến hạn và mục mới của bài 26", N4 items), `/lessons` marks lesson 26 as the one to continue; a signed-in learner in the same state sees "Tiếp tục học" → `/review` with "0 đến hạn · 10 mới".

## Acceptance criteria
- **AC-1** `validate:content` passes with the N4 blueprint check; 80 minutes; every question has `explain`.
- **AC-2** `/test?level=4` lists N4-1; a full run shows exact per-part scores (E2E answers a known pattern).
- **AC-3** The N5 → N4 journey above passes on mobile and desktop.
- **AC-4** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass; screenshots of the N4 intro, a `text` question and the result at 360 and 1440 looked at.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/content/content.spec.ts` | Vitest |
| AC-2 | `kotoba-fe/e2e/test-n4.spec.ts` | E2E |
| AC-3 | `kotoba-fe/e2e/n4-path.spec.ts` | E2E |
| AC-4 | full suites | all |

## §7.2 case groups
Content + one journey: happy path, wrong data (blueprint, explain), boundaries (all N5 learned exactly; N4 lesson 26 first), display (long passages at 360 and 768). Others as phase 14 (unchanged code paths).

## Self-review notes
