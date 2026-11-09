# Phase 28: N3 vocabulary (batches 28a–28i)

Roadmap: `docs/plan/PLAN.md` "27–30. N3" (repeat of "24. Từ vựng N4") and the shared content checks. Rules: `AGENTS.md` §12. Starts after the sample review of 2026-11-09 (`docs/tasks/sample-review.md`).

## Goal
N3 words in lessons 46–80, in batches of ~200, one commit per batch, each batch through the full gate. Target about 1,500–1,800 words; a batch may come out shorter when the lessons' themes run out of real N3 words (as 24a did), and the shortfall is reported, not padded.

## Scope
Per batch:
- New `vocab.json` entries, same shape as N4 (`id: vocab:<word>`, word, optional `kanji`, reading, romaji, vi, en, example {ja, vi, en}, lesson, `level: 3`, `reviewed: false`). Ids are new; no N5/N4 entry changes.
- **Kanji gate:** every kanji in `word` is in `kanji.json` at level 5, 4 or 3; otherwise `word` is in kana and the usual spelling goes in `kanji`.
- **No duplicates** with existing words (same written form + reading), and an id `vocab:<word>` must be unique. A homophone whose id is taken is skipped and listed in the batch report (BACKLOG: id scheme for same-kana words).
- **JMdict:** every (word or kanji spelling, reading) pair passes `npm run jmdict`; examples use the word and keep to N5–N3 vocabulary and kanji.
- Words of a lesson fit its theme (`lessons.json` titles); lesson 81 "Ôn tập N3" has no words.
- Batch split (4 lessons each, the last 3):

| Batch | Lessons |
|---|---|
| 28a | 46–49 |
| 28b | 50–53 |
| 28c | 54–57 |
| 28d | 58–61 |
| 28e | 62–65 |
| 28f | 66–69 |
| 28g | 70–73 |
| 28h | 74–77 |
| 28i | 78–80 |

- `content.spec.ts` inventory gets the new exact vocab counts (N5 694 + N4 578 + N3 n); FE/BE tests with fixed counts are updated with the reason.

Out: grammar (29), mock test (30), the same-kana id scheme (BACKLOG).

## Acceptance criteria (each batch)
- **AC-1** `npm run validate:content` (content spec + JMdict) passes; inventory counts exact.
- **AC-2** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass (fixed counts updated with the reason).
- **AC-3** Screenshots of `/vocab?level=3` and one filled N3 lesson page at 360 and 1440, looked at.
- **AC-4** Every new word `reviewed: false`; the batch report lists the words the author is unsure belong to N3, the skipped homophones, and a seeded sample of 30 (§12).

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/content/content.spec.ts`, `scripts/jmdict-check.ts` | Vitest / script |
| AC-2, AC-3 | full suites; `e2e/levels.spec.ts` / `e2e/vocab.spec.ts` | E2E |

## §7.2 case groups
Content: happy path, wrong data (gate, duplicates, JMdict), display (long meanings in decks and the word page), large data (the file passes ~3,000 items: seed time and `/vocab?level=3` paging). Others N/A: no runtime code changes.

## Self-review notes
