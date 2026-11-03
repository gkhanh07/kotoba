# Phase 23: N4 kanji

Roadmap: `docs/plan/PLAN.md` "23. Kanji N4" and the shared content checks. Rules: `AGENTS.md` §12.

## Goal
The 181 kanji of KANJIDIC2's old JLPT level 3 become N4 kanji, each with a Vietnamese meaning, a lesson and look-alike pairs where they help.

## Scope
In:
- `scripts/kanjidic.ts`: `INCLUDE_LEVELS = [5, 4]`; run it. N5 entries stay byte-identical; N4 entries come with `level: 4`.
- `lessons.json`: N4 lessons numbered on from 25 (`lesson:26` …), `level: 4`, Vietnamese + English titles by theme (about 20 lessons; the same lessons phases 24–25 will fill with words and grammar). The last N4 lesson is "Ôn tập N4" with no kanji, like `lesson:25`.
- Each N4 kanji: `vi` (short Vietnamese meaning, authored from its KANJIDIC English meanings and Hán Việt; no invented readings — readings stay KANJIDIC's), `lesson` (one N4 lesson, grouped by theme, roughly 8–10 kanji a lesson), `reviewed: false`.
- New `similar` pairs among N4 kanji or between N4 and N5 kanji where they are genuinely confused visually (e.g. 待/持/特, 体/休, 早/草, 牛/午, 犬/大/太, 力/刀 only if both exist), symmetric.
- FE/E2E: fixed counts or "N4 is empty" assertions that legitimately change are updated (e.g. `e2e/levels.spec.ts` expects `/kanji?level=4` to be empty; it now shows N4 kanji, so that page leaves the empty-state loop and gets an exact count).

Out: N4 vocab (24), grammar (25), mock test (26).

## Acceptance criteria
- **AC-1** `kanji.json` has 103 N5 kanji unchanged and 181 N4 kanji, all with `level: 4`, non-empty `vi`, a `lesson` that is an N4 lesson, `reviewed: false`.
- **AC-2** Re-running `npm run kanjidic` makes no diff.
- **AC-3** `content.spec.ts` passes: lesson exists and shares the level; `similar` exists and is symmetric (update its fixed counts to the new totals, exact).
- **AC-4** `npm run validate:content`, BE `npm run check`, FE `npm run check` and full `npm run test:e2e` pass.
- **AC-5** Playwright screenshots of `/kanji?level=4`, `/lessons` (N4 group) and one N4 lesson page at 360 and 1440, looked at.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1, AC-3 | `kotoba-be/content/content.spec.ts` (+ a test: every level-4 kanji has `vi` and an N4 lesson) | Vitest |
| AC-2 | `npm run kanjidic && git diff --exit-code content/kanji.json` | script |
| AC-4, AC-5 | full suites; `e2e/levels.spec.ts` updated for N4 kanji | E2E |

## §7.2 case groups
Content phase: happy path (AC-1), wrong data (spec checks), display (long `vi` wraps in tiles/detail; screenshots), large data N/A (284 kanji). Others N/A: no code paths change.

## Self-review notes
- N5 entries are not byte-identical after all: 10 N5 kanji (大 間 学 目 午 聞 万 白 休 駅) gained `similar` links, because N4↔N5 pairs must be symmetric. Only `similar` was appended; everything else in N5 is unchanged (right after the script ran, before authoring, all 103 were identical).
- 20 N4 lessons (26–45, 45 = "Ôn tập N4" with no kanji), 181 kanji, 23 new `similar` pairs (54 kanji / 68 links in all). `content.spec.ts` asserts 181 N4 kanji with `vi` and an N4 lesson.
- `reviewed: false` on all 181. Least sure meanings: 以 方 代 台 便 質 元 画 去 堂 館 院 英 世. KANJIDIC Hán Việt kept as is though odd: 県 "Huyền", 着 "Khán" (BACKLOG).
- E2E: the empty-state loop moved from N4 to N3; new tests count N4 kanji per page and the N4 lesson group from the JSON. BE e2e counts now come from the JSON (`kanji.length`, level filters) and the "empty level" checks use N2.
- Found BUG-005 (stale fetch cache in E2E); Playwright now clears `.next/cache/fetch-cache` before building.
- `reviewer`: PASS. Fixed after review: `content.spec.ts` pins the inventory exactly (224 kana, 103 + 181 kanji, 25 + 20 lessons) since the BE e2e now derives its counts from the JSON; the N4 E2E asserts exact lesson titles (first/last N4 lesson, lesson 26 heading and "Bài 26 / 45"); 太 "to, dày; béo" (was "béo, to"). Kept: the 姉/妹 pair (same 女 frame and paired in use); loosely themed placements (代 光 力 有 発 回) can move when phases 24–25 fill the lessons.

