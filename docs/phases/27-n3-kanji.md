# Phase 27: N3 kanji

Roadmap: `docs/plan/PLAN.md` "27–30. N3" (repeat of "23. Kanji N4") and the shared content checks. Rules: `AGENTS.md` §12. Level source: `docs/decisions/006-n3-n2-kanji-levels.md`.

## Goal
The N3 kanji become Kotoba content. The level list is Jonathan Waller's (CC BY) minus the kanji Kotoba already teaches at N5/N4, which leaves 341 kanji. Each kanji gets a Vietnamese meaning, an N3 lesson, and look-alike pairs where they help.

## Scope
In:
- `scripts/levels.txt` (new): Waller's N3 and N2 lists exactly as published (367 + 367 kanji), with a header that credits the source and the licence.
- `scripts/kanjidic.ts`:
  - Read `levels.txt`.
  - A kanji's level is `EXTRA`, then KANJIDIC2 old 4/3 → N5/N4, then `levels.txt`.
  - `INCLUDE_LEVELS = [5, 4, 3]`.
  - Run it. The 284 N5/N4 entries stay byte-identical, and the N3 entries come with `level: 3`.
- `lessons.json`: N3 lessons numbered from 46. They have `level: 3` and Vietnamese and English titles by theme. There are 36 lessons (46–81), 35 of them with roughly 8–12 kanji each, and these are the lessons that phases 28–29 will fill with words and grammar. The last N3 lesson is "Ôn tập N3" and has no kanji, like `lesson:25` and `lesson:45`.
- Each N3 kanji gets:
  - `vi`: a short Vietnamese meaning, authored from the KANJIDIC English meanings and the Hán Việt reading. Readings are never invented; they stay as KANJIDIC gives them.
  - `lesson`: one N3 lesson, grouped by theme.
  - `reviewed: false`.
- New `similar` pairs among the N3 kanji, or between N3 and N4/N5 kanji, where they are genuinely confused visually. Pairs are symmetric, so an older kanji gains only the appended `similar` link.
- `/legal` (vi and en): credit Jonathan Waller / tanos.co.uk (CC BY) for the N3 and N2 lists, and say they are unofficial.
- BUG-010 (found by this phase's e2e): paged kanji go lesson by lesson, so a lesson's group is no longer spread over pages.
- FE/BE tests: fixed counts and "N3 is empty" assertions are updated. The empty-state loop in `e2e/levels.spec.ts` moves from N3 to N2, and N3 kanji get a test with an exact count.

Out:
- N3 vocab (28), grammar (29) and the mock test (30).
- N2 kanji (31): `levels.txt` already holds the N2 list, but level 2 is not in `INCLUDE_LEVELS`.
- README credits. The READMEs are still the framework boilerplate; phase 35 rewrites them and lists every credit.

## Acceptance criteria
- **AC-1** Given the script has run, `kanji.json` has 103 N5 and 181 N4 kanji unchanged apart from appended `similar` links, plus 341 N3 kanji. Every N3 kanji has `level: 3`, a non-empty `vi`, a `lesson` that is an N3 lesson, and `reviewed: false`.
- **AC-2** When `npm run kanjidic` is run again, it makes no diff.
- **AC-3** `content.spec.ts` passes:
  - It pins exact counts: 103/181/341 kanji and 25/20/N lessons.
  - Every kanji on Waller's N3 list is at level 3, 4 or 5, and the N3 kanji are exactly that list minus the N5/N4 ones.
  - `similar` is symmetric.
  - Every lesson exists and shares its items' level.
- **AC-4** `/legal` shows the Waller / tanos.co.uk CC BY credit (an E2E test asserts the text).
- **AC-5** `npm run validate:content`, BE `npm run check`, FE `npm run check` and the full `npm run test:e2e` all pass.
- **AC-6** There are Playwright screenshots of `/kanji?level=3`, `/lessons` (the N3 group) and one N3 lesson page at 360 and 1440, and they have been looked at.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1, AC-3 | `kotoba-be/content/content.spec.ts`: inventory counts; each N3 kanji has `vi` and an N3 lesson; the N3 set equals `levels.txt` N3 minus N5/N4 | Vitest |
| AC-2 | `npm run kanjidic && git diff --exit-code content/kanji.json` | script |
| AC-4 | `e2e/levels.spec.ts` "/legal names the source of the level lists" | E2E |
| AC-5, AC-6 | Full suites. In `e2e/levels.spec.ts`: an N3 kanji page count, the N3 lesson group, lesson 46, and the empty-state loop now on N2 | E2E |

## §7.2 case groups
- Happy path: AC-1.
- Wrong data: the spec checks, including the comparison with `levels.txt`.
- Display: long `vi` text wraps in the tiles and on the detail page (screenshots), and `/kanji?level=3` pages by 100 (341 → 4 pages).
- Large data: 625 kanji in all, which is under the 5,000 threshold.
- Paging: every page of N5/N4/N3 kanji, in lesson order (BUG-010, `test/content.e2e-spec.ts`).
- Others are N/A. The runtime changes are the `/legal` text and the order of paged kanji (BUG-010).

## Self-review notes
- Found by the phase's own e2e: BUG-010, paged kanji split a lesson over several pages. Fixed in `content.controller.ts`, and `content.e2e-spec.ts` now checks every page of N5/N4/N3.
- `reviewer` verdict: PASS, with no Critical or High findings. Its checks:
  - All 284 N5/N4 entries are unchanged, apart from appended `similar` links.
  - The 40 new pairs are symmetric.
  - AC-2 is idempotent.
  - Each of lessons 46–80 holds 8–12 kanji, and lesson 81 holds none.
- Fixed after review:
  - BUG-011: XML entities in `en` ("coming &amp; going" on 交, "man &amp; wife" on 偶). `kanjidic.ts` now decodes them, and a content test checks for them. Only those two meanings changed, and a re-run is byte-identical.
  - AC-1 `reviewed: false` had no assertion. There is now a content test for it.
  - `content.e2e-spec.ts` used a literal `100`. It now uses `PAGE_SIZE`.
  - 払 "Chàng" and 込 "Liêu" were added to BUG-009, which stays OPEN: the user has to choose a Hán Việt source.
- Left as they are:
  - Lesson fit is loose for 和 (48), 園/遊 (54), 鳴 (58), 原 (74) and 王 (78). The N3 vocab in phases 28–29 can anchor them (和食, 遊園地, 原因), so they are reviewed then.
  - On `/legal`, the link text "tanos.co.uk" points to the web.archive.org copy. This is deliberate, and the code comment explains it.
