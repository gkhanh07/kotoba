# Phase 25: N4 grammar

Roadmap: `docs/plan/PLAN.md` "25. Ngữ pháp và bài học N4". Rules: `AGENTS.md` §12.

## Goal
About 40 N4 grammar points, each with explanation and examples, placed in the N4 lessons 26–44 so every N4 lesson has kanji, words and grammar.

## Scope
- `grammar.json`: new entries in the N5 shape (`id: grammar:<slug>`, slug, lesson 26–44, `level: 4`, pattern, title {vi, en}, structure, explain {vi, en}, 2–3 examples {ja, vi, en}, optional note, `reviewed: false`). Slugs are new, kebab-case romaji.
- Examples use N5/N4 kanji only (others in kana) and N5/N4 vocabulary; every example shows the pattern.
- Spread: 1–3 points per lesson 26–44, ordered so a point only builds on points of earlier lessons (e.g. て-form uses before ている/てしまう; potential before ようになる).
- Lessons: lesson titles stay (they were set in phase 23); no lesson renumbering.
- `content.spec.ts`: inventory gets the exact grammar counts per level; a test that every N4 lesson 26–44 has at least one grammar point.
- E2E: `/grammar?level=4` lists them (fixed counts derive from the JSON); the empty-state loop already uses N3.

Out: mock test (26).

## Acceptance criteria
- **AC-1** `npm run validate:content` passes; inventory exact; every N4 lesson 26–44 has ≥ 1 grammar point.
- **AC-2** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass.
- **AC-3** `/grammar?level=4`, one N4 grammar detail page and lesson 26 at 360 and 1440, looked at.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/content/content.spec.ts` | Vitest |
| AC-2, AC-3 | full suites; `e2e/levels.spec.ts` (`/grammar?level=4` count from JSON) | E2E |

## §7.2 case groups
Content: happy path, wrong data (spec checks), display (long patterns and explanations at 360px). Others N/A.

## Self-review notes
