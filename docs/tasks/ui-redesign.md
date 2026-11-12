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

## 5. Performance
(The `/vocab` and `/kanji` measurements go here.)
