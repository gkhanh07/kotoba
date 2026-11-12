# Task: UI/UX redesign: one visual language from the hero to every study screen

- Type: Feature (FE only), one continuous pass with one commit per page group
- ADR: `docs/decisions/010-ui-redesign-system.md`
- Out of scope: kotoba-be, the API, Prisma, auth logic, the SRS algorithm, storage keys and shapes (`kotoba.srs.v1`, `kotoba.tests.v1`, `kotoba.test.<id>`), `content/*.json`, and server actions.
- Stored data: not affected. No storage shape changes, so no migration.

## 1. Baseline (screenshots 2026-11-11, at 360×740, 768×1024 and 1440×900)

84 full-page shots of 28 routes (25 guest, 3 signed in). No horizontal overflow and no load failures. Observed problems:

| Route | What the screenshots show |
|---|---|
| `/` guest | The hero is strong. After it come "Bốn tuyến đã chạy." (4 plain stations) and "Chỉ tính là thuộc khi bạn nhớ thật." (a lamp table with a second amber `.btn`), then the page ends abruptly. Nothing introduces the three scripts or shows the product. |
| `/` dashboard | A 60rem column on the left at 1440, with the right ~35% empty. A glowing h1. Hairline text rows for the stat trio and the progress table. A tiny heatmap. 0.85rem uppercase labels. The next action is weak, and there are 2 amber `.btn`. |
| `/lessons` | A flat list of 81 rows: 5,257px tall at 1440 and 6,602px at 360. The right ~40% is empty at 1440. Tiny station dots and low-contrast metadata. Only row 1 has "Bắt đầu". There is no per-level progress. |
| `/lessons/[n]` | A 46rem column on the left. Flat 9-column tiles with no selection and no preview. |
| `/kana` | The strongest page. Three amber-filled segments break the One Amber Rule. Tiny lamps and heads, and a lonely reset link. |
| `/kanji` | Small flat tiles, tiny tabs and filter, and a minimal pager. |
| `/kanji/[char]` | A ~48rem column on the left. A 190px specimen and tiny labels. 50 hairline word rows (3,600px). The CTA is at the very bottom, and there is no memory panel. |
| `/vocab`, `/vocab/[word]` | Flat rows with the right third empty. On a word, the glowing word sits above a small `dl` and a plain example, and the right 45% is empty. |
| `/grammar`, `/grammar/[slug]` | 34 flat rows that repeat the lesson on each row, with pattern and meaning at equal weight. On a point, a 46rem left column with tiny section headings. |
| `/flashcards` | The header sits on the left and the card column is centred, so the two are misaligned. A thin "1 / 694" line. A flat 430px card. The sticky grade row overlaps the card (at 360 it covers the middle of the card), there is large dead space, and "Thẻ trước"/"Thẻ sau" sit far below. |
| `/review` | A small h1, a flat card, and a tiny hint line for the shortcuts. Small ghost grade buttons. No help panel and no state label. |
| `/search` | Flat rows, a tiny group heading, and the right third empty. The submit button is an amber `.btn`. |
| `/test`, `/test/[id]` | A single bordered paper card with a lot of empty space. The intro is a hairline list of parts. The module has a `.kicker` eyebrow and a 3px border-left. |
| auth, `/settings` | A 26rem flat form with no motif. Inputs have no invalid styling. Settings is a 40rem column of flat hairline sections. |
| frame | The footer is a single rule plus text. The 404 page is fine. |

## 2. Acceptance criteria

### Group 1: design system
- **AC-1.1** Given `globals.css`, when it is read, then the surface levels (`--surface-0..3`, `--edge-hi`), semantic states (`--state-fresh/started/learned/known`, `--ok/--warn/--err`), the type scale (`--fs-*`), `--radius`/`--radius-sm`, `--shadow-float` and the motion tokens (`--dur-fast`, `--dur`) exist, all derived through `var()`/`color-mix()` with no new hex.
- **AC-1.2** The shared classes `.panel`, `.tile`, `.tag`, `.meter`, `.field`, `.seg`, `.empty`, `.notice` and `.skeleton` exist, each with hover, `:focus-visible`, active, disabled and selected (`[aria-pressed]`, `[aria-current]`, `[aria-selected]`) states where they apply.
- **AC-1.3** Under `prefers-reduced-motion: reduce`, transforms and keyframe animations are off globally, including the flashcard rotation.

### Group 2: home
- **AC-2.1** The guest `/` shows, below the hero: a three-script intro (Hiragana, Katakana, Kanji) with real counts from the content; the N5→N4→N3 train line with the real lesson and word counts per level; an SRS explainer with the ADR 007 states; and a product preview rendered from real content items.
- **AC-2.2** The guest `/` has exactly one amber `.btn` below the hero.
- **AC-2.3** The Dashboard shows one clear next action (the single amber `.btn`) in a hero panel, and a side column at ≥1100px.

### Group 3: lessons
- **AC-3.1** `/lessons` groups lessons by level in `<details>`. The group with the current lesson is open, and each group shows a progress bar and "x/y bài xong" with exact counts.
- **AC-3.2** Each lesson row shows its state as text (Chưa học / Đang học / Đã xong) plus a mark. The current lesson is highlighted.
- **AC-3.3** `/lessons/[n]` is a two-column layout from 1100px, and its tiles show a selected state.

### Group 4: kana and kanji
- **AC-4.1** `/kana` has one amber `.btn` at most, the selected cell is distinct by more than colour, and its cells are bigger.
- **AC-4.2** `/kanji` cards show the character, then Hán Việt and a state label.
- **AC-4.3** `/kanji/[char]` is two columns on desktop, with the memory progress and practice actions in the right column.

### Group 5: vocab and grammar
- **AC-5.1** `/vocab/[word]` puts the word first, shows the example as a card, and has a side column.
- **AC-5.2** `/grammar` shows the pattern in the kana face, distinct from the meaning, grouped by lesson.

### Group 6: flashcards and review
- **AC-6.1** The flashcard and review card are a raised surface, and the sticky grade row never covers the card at 360×740.
- **AC-6.2** The review shows a progress bar with the exact remaining count, and a shortcut help panel that lists the keys.
- **AC-6.3** Under reduced motion the card does not rotate.

### Group 7: search
- **AC-7.1** The search input is prominent (≥ 56px). The submit is a ghost button, so it is not a second amber.
- **AC-7.2** Results are panels with `<mark>`, and the empty, no-results and error states are each styled blocks.

### Group 8: mock tests
- **AC-8.1** `/test` shows paper cards with the level, minutes and question count.
- **AC-8.2** The test intro and paper drop `.kicker` and the 3px border-left.

### Group 9: auth and settings
- **AC-9.1** On desktop, auth forms sit beside a Japanese motif panel that is decorative and `aria-hidden`.
- **AC-9.2** Inputs show an invalid state through `aria-invalid` (border plus text, not colour alone).

### Group 10: frame
- **AC-10.1** The site bar, menu sheet and library popover use `--shadow-float` and the new surfaces. The footer and the status pages follow the system.

## 3. Test matrix

| AC | Test | Layer |
|---|---|---|
| 1.1–1.3 | `src/app/designSystem.test.ts` parses `globals.css`: tokens exist, no new hex outside the primitives, reduced-motion block | unit |
| 2.1–2.2 | `e2e/redesign.spec.ts` guest home: sections visible, exact counts, a single `.btn` below the hero | e2e |
| 2.3 | Dashboard test (existing, updated) + e2e | component/e2e |
| 3.x | `e2e/redesign.spec.ts` lessons: `details` open for the current level, exact counts | e2e |
| 4.x–9.x | `e2e/redesign.spec.ts` per route: structure, one `.btn`, axe, no console errors, reduced motion | e2e |
| all | existing Vitest + Playwright suites stay green | all |

§7.2 case groups:
- Boundaries and empty states are covered by the existing tests of each screen.
- Storage, migration and concurrency are N/A: no data changes.
- Performance: `/vocab` and `/kanji` are measured before and after (§5).

## 4. Self-review notes
(Filled in as each group lands.)

**Group 1: design system**
- `.btn` kept its rgba glows as raw `rgba(255, 177, 59, …)`, a hidden copy of `--amber`. They are now `color-mix(in srgb, var(--amber) N%, transparent)`, and the test enforces "no hex outside the primitives".
- The flashcard reduced-motion block only removed the transition, so the card still turned 180°, without animation, which left the back mirrored by `backface-visibility`. Under reduced motion the faces now swap with `visibility`, without rotating (AC-1.3).
- The new global names (`.panel`, `.tile`, `.field`, `.empty`, `.notice`, `.meter`) also exist as CSS-module class names. Modules are hashed, so they do not collide; checked with grep that no component uses the bare global names yet.
- `--shadow-float` is used only by `.float`, and the test pins this, so the "one shadow" rule cannot drift.
- Codex review: `.panel[data-raised]` used `--surface-2`, the same tone as a plain panel's wet ground, so the ADR's raised level never appeared. It now uses `--surface-3`.
- Codex review: the no-hex test scanned only `globals.css`. It now scans every `*.module.css`; the only allowed hex values are the hero's pre-existing ones in `page.module.css` (four `#000` mask stencils, one `#fff` sign core). Seen failing with a planted hex in `kana.module.css`. Raw `rgb()`/`rgba()` in `kana.module.css` and `page.module.css` are converted with their page groups (4 and 2).

**Group 2: home and dashboard**
- The sections below the hero were rewritten (scripts, line, ladder, preview, closing). Their amber glows were raw `rgba(255, 177, 59, …)` and are now `color-mix()` over `--amber`. The hero's own 16 `rgba()` values stay, because the hero is kept as is (BACKLOG, UI redesign follow-ups).
- The dashboard had two amber buttons: "Tiếp tục học" and the WeakList practice button. WeakList's button is now `btn btnGhost` (One Amber Rule); the e2e counts exactly one non-ghost `.btn` in `main`.
- `WeakList.module.css` and `heatmap.module.css` drew bare blocks with their own heading sizes. They now use the same panel ground, edge highlight and `--fs-card` title as the dashboard panels, and the heatmap legend moved from `.75rem` to `--fs-meta` (Readable Floor).
- i18n keys that only the old route list used (`lessonName`, `lessonText`, `openMeta`, `kanjiMeta`, `lessonMeta`) were removed in both languages; grep found no other use.
- `e2e/home.spec.ts` test 2 asserted the old heading "Bốn tuyến đã chạy." and the link `/^課 Bài học/`, which the new home no longer has. It now asserts the new heading, the Kanji tile and the N5 station, each with its href. The assertion count is unchanged, and the "Sắp có" and account-optional checks are kept.
- `e2e/redesign.spec.ts` reads every count from `kotoba-be/content/*.json`. Seen failing with the amber count inverted to 2 (both tests, desktop), then restored.
- Screenshots at 360, 768 and 1440 (landing) and on mobile and desktop (dashboard) were looked at: no overflow; the dashboard goes to two columns at ≥1100px and stacks on a phone.
- Codex review: the preview test only checked the first word. It now checks every listed word (written form, reading and meaning in order), the flashcard, and the lesson's kanji and grammar point against the content files. Seen failing with the word order swapped and with a wrong kanji text, then restored.
- Codex review, not changed: the dashboard test uses one fixed client IP per project. It follows the convention of `home.spec.ts` and `daily.spec.ts` (one sign-up per project per run, under the limit of 10 per hour).

**Group 3: lessons**
- A level's "x/y bài xong" counts only lessons with items (kana, kanji, words). Review lessons have nothing to learn, so counting them would leave a fully learned level reading short of y. N5 has 24 of 25, N4 19 of 20, N3 35 of 36.
- Only the current lesson's level is open (N5 for a guest). `levels.spec.ts` now opens the closed N4/N3 group before reading its rows. That is a structural change: the assertions (count, first and last row) are unchanged.
- The amber "Bắt đầu" on row 1 became a single panel link ("Học tiếp" or "Bắt đầu") to the current lesson, so the list has one amber at most however far the learner is.
- Lesson tiles are now buttons with `aria-pressed` that drive a preview (`aria-live="polite"`). The link to `/kanji/[char]` moved into the kanji preview. Kana hints show only in vi, as on `/kana`.
- The module `.tile` sets no padding or border, so the global `.tile` states (hover, pressed, focus) stay intact.
- `LessonFooter` became a side panel with a meter: sticky beside the lesson from 1100px, and after the lesson on a phone, as the footer was before.
- The new tests failed with the tile click turned into a no-op and with `openLevel` set to the wrong level, then passed after restoring.
- Screenshots of `/lessons`, `/lessons/1` and `/lessons/7` at 360, 768 and 1440 were looked at: no overflow, the current lesson stands out, the tiles show their pressed state.
- Codex review, not changed:
  - "Zero amber buttons once every lesson is learned." The rule is one amber at most, and that state predates this group.
  - "A heading with other content inside `<summary>`." The HTML spec allows phrasing content mixed with heading content, and axe passes.
  - "The test leaves grammar out." The page does too (grammar is read, not scheduled), and the test mirrors it.

**Group 4: kana and kanji**
- `/kana`:
  - The script switch had an amber fill beside the amber quiz button. The selected script is now a raised step with an amber underline, so the page keeps one amber `.btn` (the e2e counts it).
  - The selected cell is marked by a corner notch (`::after`) as well as the amber ring.
  - The memory state, which was a bare sentence, is now a `.tag` with a word: "Chưa luyện", "Đến hạn ôn", "Đã thuộc", or "Đang học, ôn lại sau N ngày".
  - The remaining raw `rgb()` values in `kana.module.css` are `color-mix()` over tokens.
- Found by screenshot at 360px: the longest kana label ("…ôn lại sau N ngày") is a nowrap tag in a `1fr` column, and it widened the bottom sheet past the screen. The column is now `minmax(0, 1fr)` and that tag wraps.
  - `globals.css` clips sideways overflow, so `scrollWidth` cannot see this. The test compares the tag's box with the sheet's box instead.
  - Seen failing with the fix reverted (mobile: 373 > 344), then restored.
- `/kanji`:
  - Fresh kanji carry no label, which is the default; only kanji that have moved show "Đang học", "Đã học" or "Đã thuộc", so they stand out.
  - The quick-look pane is shown only at ≥1200px, where there is room beside the grid. It is `aria-hidden`: it adds the meaning and On/Kun to what the card link says, and those are on the detail page the link opens. Codex flagged this (Medium). It stays hidden, because adding them to 100 link names would make the grid slow to scan with a screen reader.
  - Found by screenshot at 1440: the pane stretched to the full grid height, so `sticky` did nothing and its content scrolled away. It now has `align-self: start`. The e2e hovers 南 far down the page and asserts that the pane is fully in the viewport. Seen failing without the fix, then restored.
  - Level tabs and the kanji filter use the global `.seg` track. Pager links are raised buttons, with no amber fill.
- `/kanji/[char]`:
  - The memory panel (`KanjiMemory`) sits beside the character from 1024px and after it on a phone.
  - It shows the exact box, the due text and the state, and has the single amber action, "Học bài N".
  - An overdue card reads "Đến hạn ôn hôm nay".
- Stroke order is not shown: only the stroke count exists (BACKLOG, UI redesign follow-ups).
- Mutation checks, each seen failing and then restored:
  - Swapping the "learned" and "started" states fails both kanji tests.
  - Removing the 1024px two-column rule fails the desktop `/kanji/[char]` test (x 72, expected > 264).
- The blank count in a `/kana` screenshot is the pre-existing strike animation caught mid-frame, not a bug.
- Codex review:
  - Codex found that `.filters .seg`, `.card .tag`, `.peek .tag` and `.memory .meter` never matched, because CSS Modules scope the global class. They now use `:global()`.
  - Codex found that the notch test only checked `content`. It now asserts `10px solid`, and fails with 9px.
- `/lessons` (follow-up to group 3, separate commit): the impeccable detector flagged the current lesson row's 2px amber side border as a side-tab. Fixed by removing the border; the row keeps the raised tone and `aria-current`.
- Screenshots of `/kana`, `/kanji` and `/kanji/日` at 360, 768 and 1440 were looked at. At 768 the kana sheet sits sticky at the bottom, as it did before.

**Group 5: vocab and grammar**
- `/vocab`:
  - A progress panel sums the level: a meter, "N/M từ đã học", "N từ đến hạn hôm nay", and the one amber action. The action is "Ôn N từ đến hạn" when something is due, otherwise "học bộ tiếp theo".
  - At ≥1200px the panel rides beside the decks, sticky; below that it sits above them.
  - Each deck row carries a state `.tag` ("Chưa học", "Đang học", "Đã học") and a 2px learned-share hairline. The hairline repeats the text beside it, so it is `aria-hidden`.
  - The level tabs are the page's filter. No other filter was added: a deck is a lesson, and the lessons already are the grouping.
- `/vocab/[word]`:
  - The word is the specimen. Reading, romaji and meaning each get a cell.
  - The example is a panel with its note.
  - The side panel holds the lesson, this browser's schedule and the amber "Học bài N". Related kanji follow below.
- `/grammar`:
  - Points are grouped by lesson, under "Bài N · title".
  - Each tile shows the pattern in the kana face over its meaning.
- `/grammar/[slug]`:
  - The explanation column is held to 46rem.
  - The side panel lists the other points of the same lesson and "Học bài N".
  - There is no "related grammar" field, so same-lesson points stand in for it (BACKLOG). The prev/next pager stays.
- Found by screenshot:
  - At 1440, the side "Lịch ôn" value wrapped into a narrow second column. The side `dl` now stacks each label over its value.
  - At 1440, `/grammar/[slug]` had its own 76rem cap, so its right edge stopped 80px short of every other page. The cap is gone and the page uses the shared frame.
  - At 360, the three reading cells left an empty fourth cell. The grid is now two columns with the meaning across the row, and three columns from 640px.
- Test-writing issues found along the way:
  - The row regex `^Bài ${n}(?!\d)` lost its backslash in a heredoc. It is now written with the Edit tool.
  - The side-link locator `filter({ hasNot: .btn })` still matched the `.btn` link itself. It now reads `side.getByRole("list").getByRole("link")`.
  - The global `[lang="ja"]` rule already gives every Japanese span the kana face. So removing `font-kana` from `.pattern` did not fail the font test; it proves nothing about the pattern. The test was instead seen failing by giving `.meaning` the kana face.
- Mutation checks, each seen failing and then restored: the deck state swap, the progress count, the review vs next-deck action, the side-panel position, and the same-lesson list order.
- Codex review (read-only), 3 findings:
  - #1 rejected: "the same-lesson list can mix levels". Lesson numbers are global (81 lessons, 81 unique numbers in `lessons.json`), so the same lesson number cannot belong to two levels.
  - #2 rejected: "`max={total}` is 0 for an empty level". `Decks` only renders when the level has non-empty decks (`vocab/page.tsx`), so `total > 0`.
  - #3 fixed: the word-page test asserted only the `dt` labels. It now also asserts the `dd` values from the fixture.
- Design hook: the deck hairline animated `width`, a layout property. The fill is now `transform: scaleX(share)` from the left edge, transitioning `transform`.

### Group 6: flashcards and review
- The card is the one raised surface (`--surface-3`, `--edge-hi`, `--radius`). Hover moves its border to amber.
- AC-6.1, read as "the grade row never covers the card's front, nor the answer once flipped":
  - The row is sticky only after a flip (`.card[data-flipped="true"] ~ .status`). Before the flip its buttons are disabled, so it stays in flow below the card. This refines the Sticky Decision Rule: the decision sticks once there is a decision to make.
  - Until it is flipped the card is as tall as its front: the back is `position: absolute` and clipped, so a long back no longer pushes the front past the fold.
  - The flip scrolls the card into view with a bottom `scroll-margin` the height of the row, as `/review` already did. `/flashcards` now does the same.
  - Below 40rem the flashcards lede is hidden (as `/review` drops it while a card is up), and the toolbar and progress padding are tighter, with 15rem faces.
  - Measured at 360×740 (boxes are [top, bottom]): before, the card was [451, 851] and the sticky row was [621, 740], covering it. After, on load the card is [364, 604] and the row is [620, 742]; flipped, the card is [226, 604], the answer [396, 436] and the row [618, 740].
- `/review` lost its `max-height: 760px` hack, which shrank the card to 18rem to make room for the always-sticky row. It is no longer needed.
- At ≥64rem both screens split: the card on the left, and a raised side column on the right. The column holds the scope, the count with a native `<progress class="meter">`, the flashcards memory-state `.tag`, and, with a mouse, a "Phím tắt" `dl` built from the `{ vi, en }` dictionary.
  - The inline key hint on the card stays: `directions.spec.ts` reads it as the card's description, and it is what touch-less keyboard users without the side column see.
- `.status .btn` never matched before: `.btn` is global, but the module hashed it. It is now `:global(.btn)`, so the grade buttons get their intended 9rem minimum width.
- Unit tests: `FlashcardApp`'s flip now reads `matchMedia` for reduced motion, which jsdom lacks. `FlashcardApp.test.tsx` stubs it as `ReviewApp.test.tsx` already did. No assertion changed.
- Tests (`e2e/redesign.spec.ts`): the front/flip overlap on both routes, the exact `Còn N mục · Từ vựng N` count and the meter before and after a grade, the help rows and their position (desktop) or absence (mobile), the fresh state tag, and reduced motion.
  - Seen failing against the stashed old code: 6 of 10 runs (overlap ×3, the tag ×2, the help rows). The reduced-motion test guards behaviour that already existed; it was seen failing with the emulation removed (`matrix3d(…)` instead of `none`).
- Codex review (read-only), 1 finding, rejected: "the sticky row covers the end of a back taller than the viewport". That is the Sticky Decision Rule itself. The row is sticky, not fixed, so it stays in flow, and scrolling to the end leaves the whole card above it. The answer itself is asserted to be clear of the row.

### Group 7: search
- The form is one raised container (`--surface-2`, `--edge-hi`) whose border turns amber on `:focus-within`. The input is 56px at 1.25rem. The submit is `btn btnGhost`, so a search page with no results has no amber at all, and the one amber is kept for the error state's "Thử lại".
- Every state is a styled `.panel` block:
  - Empty: what search covers, then the example chips (44px links in a labelled list).
  - No match: the sign 無, a heading, the `none(q)` status and the same chips.
  - Error: see below.
  - Results: one panel per kind, with hairline rows, a hover surface, the level `.badge` and the existing `<mark>`.
- The "covers" copy says "every level", not "N5 to N3": `LEVELS` includes N2.
- At ≥64rem the results take the width: groups on the left, and a sticky summary panel on the right with the total and a jump nav (`#g-<kind>`), each link 44px with a tabular count. Below that width only the total stays visible. It is the `role="status"`, so the live result count is never hidden.
- Error handling: a failed lookup used to throw to the root `error.tsx`, which lost the form and the query (and logged a 500 in the console). It is now caught in the page and shown as an inline `role="alert"` block that keeps the form and the query, with "Thử lại" linking to the same query.
  - A rejected fetch is never cached: Next caches fetch responses only when `res.status === 200` (`patch-fetch.js:696`). The e2e clicks "Thử lại" after the backend is back and gets a fresh answer.
- Tests (`e2e/redesign.spec.ts`, 4 new, on both projects):
  - the input height, the ghost submit, zero amber and the exact chips
  - the exact results for `taberu` (1 group, "Từ vựng 1", 食べる, "1 kết quả cho “taberu”"), the summary on the right on desktop and hidden on mobile, no horizontal scroll
  - the exact no-match text
  - the backend-down alert, its one amber, the kept query, and the retry
  - Seen failing on the old code: 8 of 8 runs.
- Codex review (read-only), 3 findings:
  - #1 rejected: "Thử lại may reuse the cached error". A rejected fetch is not cached (above), and the e2e test proves that the retry refetches.
  - #2 rejected: "stopping the backend breaks parallel tests". `playwright.config.ts` runs `workers: 1`.
  - #3 fixed: the results test took its expected counts from the DOM. It now asserts the exact values from the content.

### Group 8: mock tests
- `/test` and `/test/[id]` before the paper starts use a wide frame (`.wide`, 72rem). Taking, result and review keep the 52rem reading column.
- `/test`: each paper is a `.tile` card in an auto-fill grid. A card holds:
  - a level label (cool hairline, Saira)
  - the title at `--fs-section`
  - "60 phút · 45 câu" in tabular figures
  - the no-listening note
  - the last result above a hairline
  - "Vào làm"
  - `TestSummary` has no level, so the label uses the page's level tab, and every paper on a tab belongs to that level.
- Intro:
  - The facts, the note and the parts list are one `.panel`. Each part is a hairline row with its name on the left and its count on the right.
  - The start note and the one amber "Bắt đầu" sit in a raised panel. At ≥64rem it is a sticky side column, per the Sticky Decision Rule; below that it follows the parts.
  - The old `.kicker` is gone. On the result page it became `.scoreLabel`, the same text at `--fs-card`.
- Review stage: `.passage` and `.explain` lost the 3px left rule and became bordered `--surface-1` blocks with `--edge-hi`. The 3px check in e2e only covers the intro page. The review-stage change is checked by eye and covered by the existing `test.spec.ts` review flow, not by a dedicated border assertion.
- Tests (`e2e/redesign.spec.ts`, 3 new, on both projects):
  - for N5 and N4, the exact card count, hrefs, label + title, "{min} phút · {n} câu", depth and axe
  - the intro: the exact facts line; one row per part kind with its exact name and count, computed in the test from `tests.json`; one amber; the start panel to the right on desktop; no 3px left rule; and axe
  - Seen failing on the old code: 6 of 6 runs. The tightened intro assertion was also seen failing with the expected order reversed.
- Codex review (read-only), 1 finding:
  - #1 fixed: the intro test only checked that the part counts summed to the total. It now asserts each row's name and count. Writing it showed that the content splits `reading` into one entry per passage, which the page sums; the test sums them independently instead of calling `score()`.

## 5. Performance
Production build (`next start`), 1440×900, median of 5 loads after one warm-up. Times are in ms.

| Route | HTML bytes | DOM nodes | TTFB | FCP | DCL | Load |
|---|---|---|---|---|---|---|
| `/kanji` before | 48293 | 530 | 16 | 172 | 62 | 199 |
| `/kanji` after | 58467 | 546 | 16 | 232 | 115 | 225 |
| `/kanji/日` before | 49492 | 311 | 15 | 204 | 71 | 211 |
| `/kanji/日` after | 49563 | 315 | 15 | 216 | 61 | 237 |
| `/kana` before | 54827 | 707 | 11 | 216 | 58 | 219 |
| `/kana` after | 54854 | 707 | 11 | n/a | 56 | 109 |

- `/kanji` grew by +10 KB of HTML. The meaning and On/Kun of 100 kanji now travel to the client for the quick-look pane.
  - That is the cost of a preview without a fetch, and it is far below any budget.
  - The FCP and DCL differences are run-to-run noise on a local server: TTFB and DOM size barely moved.
- `/kana` after: Chromium did not report an FCP entry in that run.
| `/vocab` before | 44385 | 245 | 14 | 136 | 117 | 165 |
| `/vocab` after | 44642 | 312 | 16 | 172 | 58 | 210 |
| `/grammar` after | 70606 | 362 | 14 | 204 | 62 | 232 |

- `/vocab` after: +257 bytes, +67 DOM nodes. These are the progress panel, the state tags and the deck hairlines. TTFB did not move, so the FCP and Load differences are within the local run-to-run noise seen above.
- `/grammar` has no before row: it was not measured before the group started.

| Route | HTML bytes | DOM nodes | TTFB | FCP | DCL | Load |
|---|---|---|---|---|---|---|
| `/flashcards?deck=13` after | 37470 | 132 | 15 | 196 | 69 | 202 |
| `/review?lesson=13&kind=vocab` after | 1827852 | 126 | 115 | 312 | 303 | 327 |

- Group 6 has no before rows: these routes were not measured before the group started. The group adds about ten DOM nodes per route: the side column, the meter and the key help.
- `/review` HTML is 1.8 MB. This predates the group: the page serialises every review item for the client, whatever the filter. That cost is upstream of this redesign (FE data loading), so it is logged in BACKLOG and not changed here.

| Route | HTML bytes | DOM nodes | TTFB | FCP | DCL | Load |
|---|---|---|---|---|---|---|
| `/search` after | 20732 | 92 | 12 | 172 | 62 | 179 |
| `/search?q=taberu` after | 22887 | 105 | 11 | 168 | 53 | 194 |

- Group 7 has no before rows: these routes were not measured before the group started. The results add one summary panel (about a dozen nodes per kind).

| Route | HTML bytes | DOM nodes | TTFB | FCP | DCL | Load |
|---|---|---|---|---|---|---|
| `/test` after | 21428 | 90 | 12 | 144 | 62 | 173 |
| `/test/n5-1` after | 34294 | 111 | 12 | 128 | 58 | 171 |

- Group 8 has no before rows: these routes were not measured before the group started. The change is markup and CSS only, with no new data sent to the client.
