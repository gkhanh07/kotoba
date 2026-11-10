# Phase 29: N3 grammar

Roadmap: `docs/plan/PLAN.md` "27–30. N3" (about 60 new grammar points). Rules: `AGENTS.md` §12. Same shape and process as phase 25 (`docs/phases/25-n4-grammar.md`).

## Goal
About 60 N3 grammar points, each with explanation and examples, placed in the N3 lessons 46–80 so every N3 lesson has kanji, words and grammar. Lesson 81 "Ôn tập N3" has none.

## Scope
- `grammar.json`: new entries in the existing shape (`id: grammar:<slug>`, slug, lesson 46–80, `level: 3`, pattern, title {vi, en}, structure, explain {vi, en}, 2–3 examples {ja, vi, en}, optional note, `reviewed: false`). Slugs are new, kebab-case romaji; existing ids are not touched.
- Examples follow the N4 convention (spaces between phrases), use only kanji present in `kanji.json` (N5–N3; others in kana) and mostly words in `vocab.json`; every example shows the pattern.
- Spread: 1–3 points per lesson 46–80 (fitting the lesson theme where natural), ordered so a point only builds on points of earlier lessons. Points already taught at N5/N4 are not repeated; a contrast with them goes in `note`.
- Two batches, one commit each: **29a** lessons 46–63, **29b** lessons 64–80.
- `content.spec.ts`: exact grammar counts per level; every N3 lesson in the finished range has ≥ 1 grammar point (46–63 after 29a, 46–80 after 29b); every kanji in an N3 grammar example is in `kanji.json`.
- E2E `e2e/levels.spec.ts`: `/grammar?level=3` lists every N3 point (count from the JSON) and the first detail page opens, axe clean, no horizontal scroll. The empty-state loop stays on N2.

Out: mock test `n3-1` (phase 30); reviewer-only fixes of N5/N4 grammar.

## Acceptance criteria
- **AC-1** Given the content files, when `npm run validate:content` runs, then it passes with exact grammar counts and every N3 lesson of the finished range has ≥ 1 grammar point.
- **AC-2** Given an N3 grammar example, when its kanji are checked, then every one is in `kanji.json`.
- **AC-3** Given `/grammar?level=3`, when it loads, then it lists exactly the N3 points of the JSON and the first one opens; axe 0 serious/critical; no horizontal scroll at 360 and 1440.
- **AC-4** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass.
- **AC-5** `/grammar?level=3`, one N3 detail page and one N3 lesson page looked at in screenshots at 360 and 1440.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1, AC-2 | `kotoba-be/content/content.spec.ts` | Vitest |
| AC-3 | `kotoba-fe/e2e/levels.spec.ts` "/grammar?level=3 lists every N3 grammar point" | E2E |
| AC-4 | full suites | all |
| AC-5 | manual screenshots | — |

## §7.2 case groups
Content: happy path, wrong data (spec checks: counts, lesson coverage, kanji in examples), display (long patterns and explanations at 360px). Boundaries, time, concurrency, persistence, storage: N/A (static content, no new UI or state).

## Self-review notes

### 29a (lessons 46–63)
- 32 points: 2 per lesson, 1 in lessons 56 and 62. N3 grammar 32, file 110. Prerequisites first: ば (N4) before ば〜ほど and さえ〜ば; ように (52) before ように言う (54); にとって (57) before に対して (63).
- Checked against N4/N5 patterns: no repeats. Near pairs separated in `note`: ように purpose vs ようになる, ため cause vs ために purpose, はずがない vs はずだ.
- Kanji outside `kanji.json` written in kana in examples (けっこん, つくえ, かいだん, れんしゅう, れんらく, えんそう, おべんとう; 国の 決定 instead of 政府).
- Unsure: maybe N4 in some lists (te-hoshii, mama, you-ni-mokuteki, kurai-teido); naturalness of the examples of tsuide-ni, sae-ba, tame-genin, ni-taishite; combined entries wake-da, aida-ni, sasete-morau.
- E2E: the N4 grammar test became a loop over N4 and N3. 178/178 on the first full run.
- Screenshots `/grammar?level=3` (32 links), `/grammar/you-to-suru` and `/lessons/63` ("Bài 63 / 81 · 10 kanji · 46 từ · 2 điểm ngữ pháp") at 360 and 1440: no horizontal scroll.
- Sample: the whole batch (32 items, no seed), in the batch report.
