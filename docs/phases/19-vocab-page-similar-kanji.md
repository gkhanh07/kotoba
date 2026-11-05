# Phase 19: vocab detail page and easily-confused kanji

Roadmap: `docs/plan/PLAN.md` §19. Rules: `AGENTS.md`.

## Goal
Every word gets its own page, and every place that lists a word links there. Kanji pages warn about look-alike kanji.

## Scope
In:
1. `app/vocab/[word]/page.tsx` (server): `GET /content/item/vocab:<word>` (existing BE endpoint), `notFound()` on 404.
2. Links to `/vocab/<word>` from search results, the kanji detail word list, the lesson page word list and the dashboard "Hay sai" block (`itemLinks`, which said "until phase 19").
3. `similar?: string[]` on 11 pairs in `kanji.json`, kept by `scripts/kanjidic.ts`, checked by `content.spec.ts`, shown on `/kanji/[char]` as "Dễ nhầm với".

Out: new BE endpoints; editing words; furigana.

## Behaviour
- **Route.** `/vocab/<word>` where `<word>` is the id suffix (`vocab:<word>`), URL-encoded. `vocabHref(word)` in `src/lib/library.ts` builds it. Unknown word → 404 page.
- **Page.**
  - Bar: back link "Từ vựng" → `/vocab`; `<Speak>` of the reading.
  - `h1` (lang ja) = `word`; facts: Cách đọc (reading, lang ja), Romaji, Nghĩa (page language), Cách viết kanji (`kanji` field, only when set), Bài.
  - Example: Japanese sentence (lang ja) with `<Speak>`, translation in the page language. Notes (page language) when the word has `notes`.
  - "Kanji trong từ": each distinct N5 kanji of `word`, in order, as a tile linking to `/kanji/<char>` with its Hán Việt (the meaning is in the link's accessible name; the tile is too small to show it). `kanjiIn(word, n5Chars)` (pure). Section hidden for kana-only words. The `kanji` field is not scanned: its kanji are above N5 by definition (§12 kanji gate).
  - Schedule (client island reading `useDeck`): no card → "Chưa học"; card → "Hộp b/6", due "đến hạn hôm nay" when `due ≤ today` else "đến hạn d/m/yyyy", and "sai n lần" (missing `lapses` = 0); box ≥ 6 adds "đã thuộc". Before hydration: "…".
  - Button "Học bài n" → `/lessons/n`.
  - Metadata title: `<word> · <meaning> · Kotoba`.
- **Similar kanji.** Pairs (all in N5 `kanji.json`): 日/目, 人/入, 入/八, 本/木, 白/百, 右/左, 間/聞, 千/十, 大/天, 母/毎, 小/少. `similar` lists the other char(s); every listed char exists; the relation is symmetric; no self-reference; no duplicates. `/kanji/[char]` shows "Dễ nhầm với" with one link per char (char + Hán Việt) when `similar` is non-empty.

## Acceptance criteria
- **AC-1** `/vocab/食べる` shows word, reading, romaji, meaning, example with translation, lesson link, and links to `/kanji/食`.
- **AC-2** `/vocab/khongco` returns the 404 page.
- **AC-3** Search vocab results, kanji detail words, lesson words and "Hay sai" vocab rows link to `/vocab/<word>`. `/search?q=taberu` → click → `/vocab/食べる`.
- **AC-4** Schedule island shows the exact box, due date / today, lapses, "Chưa học", "đã thuộc" from a known deck.
- **AC-5** `kanjiIn` returns distinct N5 kanji in order; none for kana words.
- **AC-6** `content.spec.ts`: `similar` chars exist, symmetric, no self, no duplicates. Re-running `npm run kanjidic` makes no diff.
- **AC-7** `/kanji/日` shows "Dễ nhầm với" linking to `/kanji/目`; a kanji without `similar` shows no such section.
- **AC-8** E2E mobile + desktop, axe clean, no console errors, no :4000 calls, no horizontal scroll at 360px.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-5 | `src/lib/library.test.ts` `kanjiIn`, `vocabHref` | Vitest |
| AC-3 | `src/lib/weak.test.ts` (vocab href), `e2e/lapses.spec.ts` (Hay sai link) | Vitest / E2E |
| AC-4 | `src/app/vocab/[word]/VocabSchedule.test.tsx` | RTL |
| AC-6 | `kotoba-be/content/content.spec.ts`; `npm run kanjidic` + `git diff --exit-code` | Vitest / script |
| AC-1, AC-2, AC-3, AC-7, AC-8 | `e2e/vocab-page.spec.ts` | E2E |

## §7.2 case groups
- Happy path: AC-1, AC-7.
- Boundaries: word with kana only (no kanji section); word with the same kanji twice; due exactly today; box 6 (known); 0 lapses / missing field.
- Empty: kanji without `similar`; word without notes / without `kanji` field.
- Broken data: unreadable deck → island shows "Chưa học" with the deck warning not repeated (store already reports `ok: false` elsewhere) — N/A beyond existing store behaviour.
- Network: BE down → existing error boundary (unchanged).
- Concurrency, time zones: due date compares day keys (ADR 003); N/A otherwise.
- Navigation: direct URL with encoded Japanese, unknown word → 404, back link.
- Keyboard & a11y: links and buttons only; `lang="ja"` on Japanese text.
- Display: long meanings wrap at 360px (E2E scroll check).
- Large data: N/A (one item per page).

## Self-review notes
- `reviewer`: PASS (no Critical/High). Fixed after review: self-review notes; DESIGN.md sections for the word page, the kanji page's "Dễ nhầm với" and the linked word lists; `content.spec.ts` asserts exactly 21 kanji / 22 links instead of "≥ 10" and no longer uses `!`; the new inline word links get a 44px hit area (padding with negative margin, so the rows do not move); spec wording for the kanji tiles' meaning.
- Test expectations changed by AC-3, not loosened: `src/lib/weak.test.ts` and `e2e/lapses.spec.ts:72` expected "Hay sai" vocab rows to link to `/lessons/n#l-vocab`; they now link to `/vocab/<word>`.
- "Dễ nhầm với" sits above "Từ chứa": after a word list of 30 rows (日) it was easy to miss.
- Kept: the e2e reads facts by their `dt` label and finds links by `href` (Japanese link names repeat across rows); no CSS class selectors.
- The 404 test accepts exactly Chromium's one "Failed to load resource" console entry, as `e2e/test.spec.ts` does.
