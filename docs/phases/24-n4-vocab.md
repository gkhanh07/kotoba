# Phase 24: N4 vocabulary (batches 24a, 24b, 24c)

Roadmap: `docs/plan/PLAN.md` "24. Từ vựng N4" and the shared content checks. Rules: `AGENTS.md` §12.

## Goal
About 650 N4 words in lessons 26–44, in batches of ~200, one commit per batch, each batch through the full gate.

## Scope
Per batch:
- New `vocab.json` entries, same shape as N5 (`id: vocab:<word>`, word, reading, romaji, vi, en, example {ja, vi, en}, optional notes, lesson, `level: 4`, `reviewed: false`). Ids are new; no N5 entry changes.
- **Kanji gate:** every kanji in `word` is in `kanji.json` at level 5 or 4; otherwise `word` is in kana and the usual spelling goes in `kanji`.
- **No duplicates** with existing words (same written form + reading), and not the homophone ids already blocked in BACKLOG (an id `vocab:<word>` must be unique).
- **JMdict:** every (word or kanji spelling, reading) pair passes `npm run jmdict`; examples use the word and use N5/N4 grammar and vocabulary.
- Words of a lesson fit its theme; each N4 lesson 26–44 ends with roughly 30–40 words over the three batches.
- Batch split: **24a** lessons 26–32, **24b** lessons 33–38, **24c** lessons 39–44.
- `content.spec.ts` inventory gets the new exact vocab counts (N5 694 + N4 n).

Out: grammar (25), mock test (26).

## Acceptance criteria (each batch)
- **AC-1** `npm run validate:content` (content spec + JMdict) passes; inventory counts exact.
- **AC-2** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass (fixed counts updated with the reason).
- **AC-3** Screenshots of `/vocab?level=4` and one filled N4 lesson page at 360 and 1440, looked at.
- **AC-4** Every new word `reviewed: false`; the batch report lists the words the author is unsure belong to N4.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/content/content.spec.ts`, `scripts/jmdict-check.ts` | Vitest / script |
| AC-2, AC-3 | full suites; `e2e/levels.spec.ts` / `e2e/vocab.spec.ts` | E2E |

## §7.2 case groups
Content: happy path, wrong data (gate, duplicates, JMdict), display (long meanings in decks and the word page). Others N/A.

## Self-review notes
