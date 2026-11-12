---
name: Kotoba
description: Learn to read the city. Kana glowing on Tokyo shop signs in the rain, read in Vietnamese.
colors:
  amber: "#ffb13b"
  amber-core: "#fff1d6"
  neon: "#ff3d6e"
  neon-soft: "#ff8aa8"
  neon-core: "#ffe3ea"
  cool: "#5cb8ff"
  cool-core: "#eaf7ff"
  night: "#050608"
  asphalt: "#0b0f16"
  wet: "#141a25"
  sky-1: "#0d1b4a"
  sky-2: "#0a1437"
  sky-3: "#070b1c"
  rule-dim: "#1a2133"
  rule: "#26304a"
  rule-strong: "#3a4768"
  chalk: "#eef3f8"
  silver: "#c9d4e0"
  silver-dim: "#93a0b4"
  silver-mute: "#5f6b80"
typography:
  sign:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 400
    lineHeight: 1
  display:
    fontFamily: "Saira Condensed, sans-serif"
    fontSize: "clamp(3.1rem, 6.4vw, 5.9rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Saira Condensed, sans-serif"
    fontSize: "clamp(2.6rem, 5vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 1.02
  title:
    fontFamily: "Saira Condensed, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.65
  kana:
    fontFamily: "Zen Kaku Gothic New, Hiragino Sans, Yu Gothic, sans-serif"
    fontSize: "clamp(2.8rem, 10vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  hairline: "2px"
  sign: "7px"
spacing:
  gutter: "clamp(16px, 4vw, 56px)"
  page-top: "clamp(1.5rem, 4vw, 3.5rem)"
  page-bottom: "4rem"
  target: "44px"
  control: "48px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.amber}"
    typography: "{typography.title}"
    rounded: "{rounded.hairline}"
    padding: "0 1.4em"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.night}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.silver}"
    typography: "{typography.title}"
    rounded: "{rounded.hairline}"
    padding: "0 1.4em"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.wet}"
    textColor: "{colors.chalk}"
  button-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.silver-dim}"
  input-field:
    backgroundColor: "{colors.asphalt}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.hairline}"
    padding: "0 .9rem"
    height: "48px"
  study-card:
    backgroundColor: "{colors.asphalt}"
    textColor: "{colors.cool-core}"
    rounded: "{rounded.hairline}"
    padding: "clamp(1.25rem, 3vw, 2.25rem)"
  segment-active:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.night}"
    height: "44px"
  nav-link-current:
    textColor: "{colors.amber}"
    typography: "{typography.title}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.neon-soft}"
    typography: "{typography.title}"
    rounded: "{rounded.hairline}"
    padding: "0 1.4em"
    height: "48px"
  button-danger-hover:
    textColor: "{colors.neon-core}"
  dialog:
    backgroundColor: "{colors.asphalt}"
    textColor: "{colors.silver}"
    rounded: "{rounded.hairline}"
    padding: "1.75rem"
  status-mark:
    textColor: "{colors.silver-mute}"
  status-mark-off:
    textColor: "{colors.silver-dim}"
  text-action:
    textColor: "{colors.amber}"
  text-action-hover:
    textColor: "{colors.amber-core}"
  structure-frame:
    backgroundColor: "transparent"
    textColor: "{colors.cool-core}"
    padding: "1rem 1.25rem"
---

# Design System: Kotoba

<!-- Scan of the shipped build, 2026-11-02. Sources: src/app/globals.css (every colour token), src/app/layout.tsx (fonts), page.tsx + Dashboard, kana/*, flashcards/*, (auth)/*; Phase 10 added kanji/*, vocab/*, Speak.tsx; Phase 11 (2026-11-03) added lessons/* (Path.tsx, LessonFooter.tsx, [n]) and grammar/* ([slug]), the Bài học nav item and Arrow's back variant; Phase 12 added review/* and the Ôn tập nav item; Phase 13 added search/* (page.tsx, search.module.css) and the Tra cứu nav item. Descriptive names and the North Star below are drafted by the documenter from the direction contract and are not yet confirmed by the user. -->

## Overview

**Creative North Star: "Reading the City at Night"**

Kotoba is a blue-hour Tokyo street in the rain. Japanese appears the way a learner first meets it, as shop-sign lettering lit in neon over wet asphalt. Every study surface is the same street after dark: a near-black ground (night, asphalt, wet asphalt), hairline rules in cold blue-grey, silver text, and three neon tubes. Each tube is a colour plus a hot white core, and each lights a different thing. Amber is for action and for progress the learner has earned. Pink is the sign being read. Blue is the train-line and the heading.

The street hero at `/` (for guests) is the only Persuade surface. It has a skyline SVG, rain, a train, and hanging signs that light up and split into kana when tapped. Every other route is an Operate or Read surface. These are flat, dense and ruled, built from rows, tables and character specimens. The world shows up on them through glow on the one thing that matters on each screen, not through decoration.

Product context: PRODUCT.md is stale. It describes a kana-only first release and predates the N5 course scope (lessons, review, search, mock tests). Treat it as the source for audience and principles, not for scope.

**Key Characteristics:**
- Dark only (`color-scheme: dark`). Every colour is a `:root` custom property in `globals.css`. Components use `var(--token)` only, and new shades come from `color-mix()` over existing tokens.
- One amber action per view. Secondary actions are ghost buttons or underlined text links.
- Neon light is emitted by text (`text-shadow` glows), not painted on as fills.
- Hairline geometry: a 2px radius, 1px to 1.5px rules, and no cards inside cards.
- Japanese is always the real script, set in its own kana face with `lang="ja"`.

## Colors

The palette is a night street: four darks, three hairline rules, four silver text steps, and three neon tubes, each with a hot core.

### Primary
- **Sodium Amber Tube** (amber): the one action colour. It is used for the `.btn` outline and fill, the current nav link, the active segment, the focus ring, the caret, and progress (meter counts, mastered kana, `progress` bars). It also marks earned state, such as a learned cell's character and the lesson station marks (half amber when started, full amber when done).
- **Amber Hot Core** (amber-core): the hover state of amber text links and the centre of the hero's amber headline line.

### Secondary
- **Sign Pink Tube** (neon): the sign being read. It is used for the kana quiz specimen glow, the hero signs, `::selection`, and armed or destructive states.
- **Sign Pink Soft** (neon-soft): form error text and the armed reset label.
- **Sign Pink Core** (neon-core): the brand mark 言葉 and the core of pink sign lettering.

### Tertiary
- **Train-Line Blue Tube** (cool): blue glow (`--glow-cool`) on page `h1`s and study-card words, and the light that spills from cool signs.
- **Blue Hot Core** (cool-core): the flashcard front word, lesson tile characters, the grammar structure line, and the hero's cool headline line.

### Neutral
- **Night** (night): page ground, the opaque backing of the sticky grade row, and text on amber fills.
- **Asphalt** (asphalt): raised surfaces such as study cards, kana cells, inputs and segments.
- **Wet Asphalt** (wet): hover fill for rows, cells and ghost buttons, and the fill of the /review empty, waiting and done panels. Reading passages are planned to use it too.
- **Blue Hour / Falling Dusk / Night Sky** (sky-1, sky-2, sky-3): only the hero sky gradient, the skyline planes (via color-mix), and the sky bleed at the top of /kana.
- **Faint Rule** (rule-dim): row dividers inside tables and lists, the section tops on /settings and /legal, and the footer rule.
- **Rule** (rule): default borders, section dividers, ghost-button edges, disabled borders, the progress track, lesson tile edges, and the dashed lesson track past the last started station.
- **Strong Rule** (rule-strong): card edges, ghost-button hover rings, station-mark outlines, the solid lesson track up to the last started station, and the grammar structure frame.
- **Chalk** (chalk): headings and the strongest text, such as the brand word, card backs and input text.
- **Silver** (silver): body text.
- **Dim Silver** (silver-dim): ledes, labels, hints, table heads, and disabled text. It is the faintest step allowed for readable text.
- **Muted Silver** (silver-mute): about 3.8:1 on night. Reserved for the large 404 numeral only.

Derived tokens (defined in `globals.css` with `color-mix`, not primitives): `tower-far/mid/near`, `tower-rim`, `window-warm/cool` (skyline), `spill-neon/cool/amber`, `halo-horizon` (light that signs throw back onto the world), and `sky-glow`, `drizzle` (atmosphere).

### Named Rules
**The One Amber Rule.** Each view has exactly one amber `.btn`. Everything else is a ghost button or an underlined text link. Amber may also mark earned progress, but never a second competing action.

**The Tube-and-Core Rule.** A neon tone is always a tube colour plus its hot core. Glow is built from the core outward (`--glow-amber`, `--glow-neon`, `--glow-cool`). Never introduce a lone saturated hue.

**The Readable Floor Rule.** Readable text uses Dim Silver or brighter. Muted Silver is for the 404 numeral only. Disabled controls are Dim Silver text on a Rule border, with no glow, as `.btn:disabled` does.

**The One Palette Rule.** Do not write hex values in components. A shade that differs from an existing token by less than about 10% per channel is that token. Use `color-mix(in srgb, var(--x) N%, var(--night))` instead of a new hex value.

**The Amber Moves On Rule.** On a lesson, the study action is the amber `.btn` and the next-lesson link is an amber text action. Once every item in the lesson is learned, the study action drops to a ghost (Ôn lại) and the next-lesson link becomes the `.btn`. The amber always sits on the next useful step, and there is never more than one `.btn`.

## Typography

**Sign Font:** Dela Gothic One (`--font-sign`, 400, latin plus vietnamese)
**Title Font:** Saira Condensed (`--font-title`, 600 and 700)
**Body Font:** Be Vietnam Pro (`--font-body`, 400/500/600, with system-ui)
**Kana Font:** Zen Kaku Gothic New (`--font-kana`, 500 and 700, Japanese slices loaded by unicode-range)

**Character:** Heavy sign lettering is used for the brand and the neon signs only. Tall condensed titles give the street its signage voice. Body text is a Vietnamese-native sans with full diacritic support, and kana are set in a calm study face that stays legible at specimen size.

### Hierarchy
- **Sign** (400, 1.6rem for the brand mark, clamp(1.7rem, 2.6vw, 2.5rem) on hero signs, line-height 1 to 1.12): the brand mark 言葉 and hero shop signs. It always glows.
- **Display** (700, clamp(3.1rem, 6.4vw, 5.9rem), 1.02, -0.01em): the hero `h1` only, in two lines, cool-core then amber-core.
- **Headline** (700, clamp(2.6rem, 5vw, 4.25rem), 1.02): the study page `h1`, in Silver with `--glow-cool`. It is followed by one Dim Silver lede of at most 65ch. Auth and Dashboard use a smaller clamp (2.2rem to 3.25rem / 3.75rem).
- **Title** (600 to 700, 1rem to 1.3rem, 0.02em to 0.08em tracking): buttons, nav links, segments, the brand word and meter text.
- **Body** (400, 1.0625rem, 1.65): running text in Silver. `p` uses `text-wrap: pretty`, and headings use `balance`.
- **Label** (400, 0.75rem to 0.9rem): hints, table heads, `dt`s and footnotes, in Dim Silver. Dashboard section `h2`s use 0.85rem uppercase with 0.08em tracking. They are headings, not eyebrows above a heading.
- **Kana specimen** (700, from clamp(2.8rem, 10vw, 5.5rem) on cards up to clamp(7rem, 17vw, 13rem) in the quiz): set in `lang="ja"` with font kerning off.

### Named Rules
**The Script-Is-Its-Own-Face Rule.** Every Japanese string carries `lang="ja"` and renders in the kana face. Never set kana in the title or body face.

**The Tabular Count Rule.** Every count, score, progress fraction and stat uses `font-variant-numeric: tabular-nums`.

## Layout

There is one content edge for the whole site. `--pad-x` is `calc(gutter + max(0px, (100% - 88rem) / 2))`, with `--gutter` at clamp(16px, 4vw, 56px). Full-bleed bands and text columns align to it. Pages pad clamp(1.5rem, 4vw, 3.5rem) at the top and 4rem to 5rem at the bottom. Reading and drilling columns narrow inside it. The flashcard study column is 48rem and centred, the Dashboard, lesson path and grammar list are 60rem, a single lesson and a grammar detail are 46rem, and auth panels are 26rem.

Study structure is rows and rules. Study sections are separated by 1px Rule borders (`border-top` or `border-block`); the quieter frame pages (/settings, /legal, the footer) use Faint Rule. Tables and lists divide rows with Faint Rule lines. Every row and link has a target of at least 44px, and form controls and buttons are 48px.

Breakpoints are 900px (the site nav becomes the Menu popover sheet, kana chart and quiz go to one column, and the kana detail panel becomes a sticky bottom sheet), 560px (segments become 2-up grids) and 480px (tighter card and table sizes). Route rows fold at 700px (lesson path, grammar list, vocab decks), and the lesson's two-column word list goes to one column at 640px.

**The Sticky Decision Rule.** On a long graded surface the one decision stays reachable. The flashcard grade row is `position: sticky; bottom: 0` with an opaque Night background and a Rule top edge, so the card back can scroll past without hiding Chưa nhớ / Nhớ rồi. The kana detail panel does the same on phones.

## Elevation & Depth

Study surfaces are flat. Depth comes from tonal steps (Night to Asphalt to Wet) and hairline rules, not shadows. The only light is neon. Glows are emitted by text (`text-shadow`) and by active controls. The hero street is the exception: signs carry layered halos and drop shadows, and the hero's ticket panel has a soft drop shadow, because they are physical objects hanging in the scene.

### Shadow Vocabulary
- **Amber glow** (`--glow-amber`): mastered kana, the selected chart cell and lit progress ticks.
- **Pink glow** (`--glow-neon`): the brand mark and the kana specimen being read.
- **Blue glow** (`--glow-cool`): page `h1`s, the flashcard word and the kanji detail specimen.
- **Button halo** (`.btn`: inset 0 0 18px amber 12% plus 0 8px 30px -12px amber 50%): the resting amber action. On hover it becomes a 1px amber ring plus 0 10px 40px -8px amber 65%.
- **Sheet lift** (0 -12px 30px night 80%): only the sticky kana detail panel on phones.

- **Float shadow** (`--shadow-float`): popovers, sheets and dialogs only (ADR 010).

### Elevation scale (ADR 010)
Four surface levels, each a tone step and never a drop shadow:
- `--surface-0` Night is the page.
- `--surface-1` Asphalt holds panels and tiles.
- `--surface-2` Wet is hover and the selected or inner level.
- `--surface-3` raised is Wet mixed toward Rule, for at most one raised element per view, such as the current lesson or the open detail panel.

A raised surface gets the 1px top-edge highlight (`--edge-hi`, an inset shadow, not a lift) and inner hairlines. Only floating layers (the library popover, the phone sheet, `<dialog>`) carry `--shadow-float`.

### Named Rules
**The Tone-Not-Lift Rule** (supersedes Light-Not-Lift, ADR 010). Study UI sits on the elevation scale: a surface is a tone step plus an edge highlight. Something matters because it glows. Shadows are for things that float above the page.

## Shapes

Shapes are hairline and nearly squared. Surfaces (panels, tiles, cards, dialogs) use `--radius` (6px), and controls (buttons, inputs, chips, segments, tags) use `--radius-sm` (4px) (ADR 010; the old 2px hairline is retired). Borders are 1px for structure and 1.5px for controls (`.btn`, `.langSwitch`, nav underline). Circles appear only as small lamps and dots (kana progress lamps, hero lamps) and as the 14px lesson station marks. Hanging hero signs use the 7px `sign` radius, and hero ticket panels use 4px. Those softer corners belong to street objects and do not carry over to study UI. Icons are 18px SVGs with a 1.75 currentColor stroke: the Arrow (square caps; its `back` variant points left on back links and the pager's previous link) and Play (an outlined triangle with miter joins, used by Speak).

## Components

### Buttons
Buttons are framed tubes that light up when touched.
- **Shape:** squared, with a hairline 2px radius and a 1.5px border. Minimum height 48px, padding 0 1.4em, set in the Title face.
- **Primary (`.btn`):** an amber outline with amber text, a faint amber text-shadow and an inset halo at rest.
- **Hover / Active / Pressed:** fills solid amber with Night text and a stronger halo, over 0.25s `--ease-out`. Focus is the global 2px amber outline at a 3px offset.
- **Ghost (`.btn btnGhost`):** a Rule border and Silver text with no glow. On hover it gets a Wet fill, Chalk text and a Strong Rule ring.
- **Disabled:** Rule border and Dim Silver text, with no fill, no glow and `cursor: not-allowed`.
- **Speak (`Speak.tsx`):** a ghost `.btn btnGhost` with the Play icon before a label (Đọc). It speaks the text through `speechSynthesis` with a `ja` voice and is not rendered at all when the browser has no `ja` voice.
- **Text action:** an amber link, underlined with a 0.25em offset, that goes to Amber Hot Core on hover. It is the standard secondary text link: the flashcard tools, Dashboard links, the kana section's chart link on a lesson, the lesson footer's next-lesson link, and the grammar pager. Standalone ones are 44px inline-flex with the Arrow. Disabled text actions use Dim Silver.
- **Back link:** Silver text with the back Arrow in a 44px row, Amber Hot Core on hover, no underline. It sits above the `h1` on kanji, lesson and grammar detail.

### Segmented controls
- **Language switch (`.langSwitch`):** a 1.5px Rule frame with Title 0.85rem buttons. The pressed button is solid amber with Night text.
- **Kana group segments:** a 1px Rule frame on Asphalt with 44px links. The current link is solid amber with Night text, and hover gives a Wet fill. Below 560px it becomes a 2-up grid.

### Cards / Containers
- **Study card (flashcard):** Asphalt with a 1px Strong Rule border and a 2px radius, at least 27rem tall. It flips 420ms on Y, and reduced motion removes the rotation. Hover turns the border amber. The front word is Blue Hot Core with blue glow.
- **Kana cell:** Asphalt with a 1px Rule border. Hover gives Wet and a Dim Silver border. Selected gets an amber border plus an inset amber ring and glow. When mastered, the character turns amber with glow.
- **Kanji tile:** a link in a `repeat(auto-fill, minmax(4.5rem, 1fr))` grid with a 6px gap. It has a 1px Faint Rule border, no fill and at least 5.5rem height, and holds the character in the kana face at 2rem over its Hán Việt in Dim Silver 0.75rem uppercase tracked 0.06em. Hover gives Wet, a Rule border and Amber Hot Core text. A learned tile (`[data-learned]`) gets a 1px amber underline under the Hán Việt plus sr-only text; there is no badge.
- There are no nested cards. Reading lists stay rows and tables; grids that are scanned (kanji, kana, test papers, lessons in a level) may use tiles (ADR 010).

### Shared classes (globals.css, ADR 010)
Every study page builds from these before writing module CSS. Each class has hover, `:focus-visible`, active, disabled and selected states (`[aria-pressed="true"]`, `[aria-current]`, `[aria-selected="true"]`, `[data-selected]`).
- **`.panel`:** a `--surface-1` block with a Faint Rule border, `--radius`, the `--edge-hi` top highlight and `--space-panel` padding. `.panel[data-raised]` is `--surface-3`.
- **`.tile`:** a grid cell or link on `--surface-1`. Hover goes to `--surface-2` with a Rule border; selected gets an amber border and an inset amber ring.
- **`.tag`:** a small status label: Title 600 at `--fs-meta`, a 1px border in the state's colour, `--radius-sm`, always with text. Its variants are `data-state="fresh|started|learned|known|ok|warn|err"`. A tag names a state or a level; it never carries a count, streak or XP.
- **`.meter`:** a 6px progress track on `--surface-2` with a `--state-learned` value. It goes with a tabular count in text and animates width over `--dur` (static under reduced motion).
- **`.field`:** a 48px input on `--surface-1` with a Rule border; focus gives the amber outline, invalid (`[aria-invalid="true"]`) gives an `--err` border.
- **`.seg`:** a segmented control: a Rule frame on `--surface-1` with 44px items; the current item (`aria-current`, `aria-pressed`, `aria-selected`) is solid amber with Night text.
- **`.empty` / `.notice`:** an empty state (`--surface-1`, dashed Rule border, Chalk title, Silver text, one way out) and an inline notice (`data-tone="ok|warn|err"` with a coloured left edge and a text label).
- **`.skeleton`:** a `--surface-2` placeholder block that pulses opacity; it is static under reduced motion.

### Inputs / Fields
- **Style:** Asphalt fill, 1px Rule border, 2px radius, 48px height and Chalk text at 1rem. Hover changes the border to Strong Rule.
- **Focus:** the global amber outline.
- **Choice chips:** a 1px Rule frame with 44px targets. Checked chips get amber text and border on `--spill-amber`.
- **Error:** inline Sign Pink Soft text.

### Destructive action
- **Danger ghost (`.btn btnGhost` plus `.danger`, settings.module.css):** the ghost button with Sign Pink Soft text. On hover it gets Sign Pink Core text, a Sign Pink Tube border and a `--spill-neon` fill. It stays a ghost, so it never competes with the view's one amber action. Account deletion uses it twice: once to open the confirm dialog and once inside it to confirm.

### Dialog
- **Modal (`<dialog>` opened with `showModal()`):** Asphalt with a 1px Strong Rule border, a 2px radius, 1.75rem padding and Silver text, at most 28rem wide. The `::backdrop` is Night at 80% (`color-mix` over transparent). The actions sit in one row: the danger ghost first, then a plain ghost Cancel that closes the dialog.

### Status lines
- **Saved (`.saved`, `role="status"`):** a Dim Silver 0.9rem line beside the submit button. The text holds for 4s, then fades to 0 over 0.4s. It is re-keyed on each save so it shows again. Reduced motion makes the fade instant. The line keeps a 1.5em minimum height so the row does not jump.

### Settings (/settings)
There are five sections (profile, language, password, data, delete account), each its own form with its own result line. They sit in a 40rem column, separated by Faint Rule top borders with 2rem padding. Section `h2`s are Chalk at 1.25rem. The profile save is the view's amber action and stays disabled until a field changes. Changing the password uses a ghost button.

- **Dữ liệu (phase 21):** between Mật khẩu and Xóa tài khoản: the Dim Silver lede says what the file holds, then a ghost `.btn` link "Tải dữ liệu học (JSON)" to `/settings/export` (1.25rem above, like the delete button). The route answers with the `kotoba-export.json` attachment, so the page does not move.

### Status pages (`.statusPage`: not-found, error, global-error)
Each is an unlit sign, one line and one way out. The layout is a left-aligned grid in a 40rem column with 1.25rem gaps. The mark above the heading is `.statusMark`, set in the sign face at clamp(4.5rem, 16vw, 9rem) with no glow:
- **404:** the numeral is the `h1`, in Muted Silver. This is the only use of Muted Silver.
- **Outage (`error.tsx`):** the mark is 停電, a sign that has gone dark. It carries `lang="ja"`, `aria-hidden` and `[data-off]`, and is Dim Silver. `global-error.tsx` replaces the root layout, so it has no mark and its fonts fall back.
- The heading is Chalk at clamp(1.6rem, 4vw, 2.25rem), and the body is Dim Silver at most 34rem wide. On the error pages `role="alert"` wraps only the heading and body, not the mark or the button. The single action is the amber `.btn`: home on the 404, retry on the error pages.

### Legal (/legal)
A 68ch reading column of Silver text at line-height 1.7. It has a Chalk `h1`, a Dim Silver "updated" line, then an in-page contents list of 44px links. Each section has a Faint Rule top border and a Chalk 1.35rem `h2`. Links on the page are Silver with a Strong Rule underline, and on hover they go to Chalk with a currentColor underline. There is no amber action.

### Level tabs and page links (phase 22)
`LevelTabs` is a server component: a `<nav aria-label="Cấp độ JLPT">` of four links, N5 N4 N3 N2, under the heading and lede of /kanji, /vocab, /grammar, /flashcards and /test. They use the filter-link style below (Silver, transparent 1.5px underline, Amber text and underline on the `aria-current="page"` link) in Title 600 at 1.1rem, each at least 44px square. The level comes from `?level=` (`levelOf`: anything unknown is N5); other params the page passes in (kanji `filter`) are kept, `page` is not. A level with no content shows a Dim Silver "Chưa có nội dung N4." line instead of the list. On /flashcards with `?deck=n` the current tab is that lesson's level.
`Pager` is a `<nav aria-label="Phân trang">` on a Faint Rule top border: "Trước" left, "Trang x / y" in tabular Dim Silver centre, "Sau" right, links in Silver with a Rule underline (Amber Hot Core on hover), 44px tall. It renders only when there is more than one page; a page past the end is the 404. /kanji pages come from the BE (100 a page); /vocab pages decks, 30 a page (`DECKS_PER_PAGE`), with the due count and "next deck" action still computed over all decks.

### Kanji list (/kanji)
The standard heading and lede, the level tabs, then a `<nav>` of filter text links (Lọc: Tất cả / Đã học / Chưa học) at 44px. They are Silver with a transparent 1.5px underline; hover goes to Chalk on a Rule underline, and the `aria-current` link is amber with an amber underline. Kanji follow in lesson groups, each under a Faint Rule top border with a Chalk 1.1rem `h2`, as a grid of kanji tiles. Page links follow the grid. Learned state is local, so a filtered view shows "—" until the schedule loads. There is no amber action.

### Kanji detail (/kanji/[char])
A 44px bar holds the back link (left Arrow, Silver, Amber Hot Core on hover) and Speak on the right. The `h1` is the specimen: a 12rem square (9rem below 600px) on Asphalt with a 1px Strong Rule border, the character at 8rem in the kana face in Blue Hot Core with `--glow-cool`. It is the page's one lit sign. Beside it are the Hán Việt line (Title 1.6rem, Chalk, uppercase, tracked 0.08em; a Japanese-made kanji with no Hán Việt, such as 込, shows "Chữ do Nhật tạo, không có âm Hán Việt" there in the missing style, and its title is the bare character, ADR 009) and a facts `dl` (7rem Dim Silver `dt`s, tabular Silver `dd`s). Below 600px they stack. "Dễ nhầm với" (only when the kanji has `similar`) comes first: a row of 5.5rem kanji tiles (the list's tile style) linking each look-alike. Then "Từ chứa 食" is a ruled word list in a 48rem column (Faint Rule rows; the word is a Chalk link to its word page with a Rule underline that goes Amber Hot Core on hover; reading and meaning in Dim Silver), with the char in the heading set in the kana face. The one amber `.btn` is "Học bài n" with the Arrow.

### Word page (/vocab/[word])
Built from the kanji detail parts. The 44px bar holds the back link (Từ vựng) and Speak (the reading). The `h1` is the word in the kana face, Blue Hot Core with `--glow-cool`, clamp(3rem, 9vw, 5.5rem), wrapping anywhere; it is the page's one lit sign. Under it the facts `dl`: Cách đọc, Romaji, Nghĩa, Cách viết kanji (only when the word has a `kanji` spelling), Bài, and Lịch ôn, a client island that reads "…" until the local schedule loads, then "Chưa học" or "Hộp b/6 · [đã thuộc ·] đến hạn hôm nay | đến hạn d/m/yyyy · sai n lần". Sections with a Faint Rule top border and a Chalk 1.1rem `h2`: Ví dụ (the sentence in Chalk 1.25rem kana face with Speak, the translation in Silver, notes in Dim Silver), then Kanji trong từ as kanji tiles (hidden for kana-only words; the meaning is in each tile's accessible name). The one amber `.btn` is "Học bài n" with the Arrow. An unknown word is the 404.

### Vocab decks (/vocab)
The standard heading and lede, then the one amber `.btn` in a 48px slot that holds its height until the local schedule loads: "Ôn n từ đến hạn" (to `/review?kind=vocab`) when words are due, otherwise "Học bài tiếp" (to the next unfinished deck). Decks are ruled rows in a 60rem column (Faint Rule top and row borders, at least 56px tall): Bài n, title, n từ, learned/due stats, Arrow. Counts are tabular and read "—" until the schedule hydrates. Hover gives Wet and Amber Hot Core text. Each row links `/flashcards?deck=n`, where the toolbar names the deck and an unknown deck is a 404. Below 700px the row folds to two lines.

### Lesson path (/lessons)
The standard heading and lede, then one section per level that has lessons, each with a Chalk 1.1rem `h2` ("N5") over its own list of stations. The course is a train line: an ordered list of stations, one per lesson, in a 60rem column. The track, the current-lesson action and the first-row count unit run across the groups as if it were one list. Each row is one link at least 56px tall, with columns for the station, the lesson number (Dim Silver 0.9rem, tabular), the title, the count and the action. Hover gives Wet and Amber Hot Core text.
- **Station mark:** a 14px SVG circle with a 1px stroke on Night. Fresh is a Strong Rule outline, started is an amber outline with the left half filled amber, and done is solid amber. Screen readers get the state as sr-only text after the title.
- **Track:** a 1px vertical line through the station column, drawn into and out of each mark. It is solid Strong Rule up to the last started station, then dashed Rule to the end. The first and last stations have no outer stub.
- **Count:** learned/total in Dim Silver 0.9rem, tabular, right-aligned. The unit (đã học) is visible on the first counted row only, like a column head, and sr-only on the rest. Counts read "—" and every station is fresh until the local schedule loads. A lesson with no items (Ôn tập N5) has no count.
- **Action:** one amber `.btn` span inside the row link (40px, 1rem): "Học tiếp" if anything is learned, otherwise the start label, on the first started lesson or else the first open one. Hovering anywhere on its row fills it. It is the page's one amber action and is absent until the schedule loads.
- Below 700px the row becomes the station, number and title with the count under the title, and the action becomes a full-width button under them; the mark stays on the title line.

### Lesson (/lessons/[n])
A 46rem column: back link (Bài học), the `h1` lesson title, and a Dim Silver lede built from the counts ("Bài 6 / 25 · 14 kanji · 22 từ · 1 điểm ngữ pháp"). Sections follow at 2.5rem, each with a Chalk 1.1rem `h2` and a Dim Silver tabular count in parentheses.
- **Lesson tiles:** the kanji-tile grid (`minmax(4.5rem, 1fr)`, 6px gap, at least 5.5rem tall) with a 1px Rule border, the character in Blue Hot Core in the kana face at 2.5rem (1.8rem for kana), and the Hán Việt or romaji under it in Dim Silver 0.75rem uppercase. Kanji tiles link to /kanji/[char] and hover to Wet with Amber Hot Core text. Kana tiles are not links; their section `h2` carries a text action to the chart.
- **Word list:** a two-column `dl` (one column below 640px) of Faint Rule rows: the word in Chalk in the kana face at 1.15rem, a link to its word page (Rule underline, Amber Hot Core on hover, hit area padded to 44px), the reading after it in Dim Silver, the meaning in Silver below, and Speak on the right.
- **Grammar rows:** 52px Faint Rule rows: the pattern in Chalk in the kana face, the title in Silver, and an Arrow. Hover gives Amber Hot Core.
- **Footer:** a Faint Rule top border, then the schedule count ("3 / 36 mục đã vào lịch ôn", Dim Silver, tabular) on the left and the actions on the right: the amber "Học bài này" `.btn` and the next lesson as a text action (see The Amber Moves On Rule). Kana lessons study each chart group in the kana quiz in turn; other lessons study at `/review?lesson=n`. Before the schedule loads the count reads "—" and the study button is absent.
- A lesson with no items (the N5 review) shows a Silver note and one amber `.btn` to /review.

### Grammar list (/grammar)
The standard heading and lede, then ruled link rows in a 60rem column (Faint Rule top and row borders, at least 56px): Bài n in Dim Silver tabular, the pattern in Chalk in the kana face, the title in Silver, and an Arrow. Hover gives Wet and Amber Hot Core text. Below 700px the three texts stack beside the Arrow. There is no amber action.

### Grammar detail (/grammar/[slug])
A 46rem column: back link (Ngữ pháp), then the pattern as the `h1` in the kana face at weight 400, clamp(2.2rem, 5vw, 3.5rem), Silver with `--glow-cool`, over a Dim Silver lede (Bài n · title). Sections have Chalk 1.1rem `h2`s.
- **Structure frame:** the one framed block on the page: a 1px Strong Rule border with no fill and no radius, padding 1rem 1.25rem, the structure in Blue Hot Core in the kana face at 1.3rem.
- **Explanation and note:** Silver prose, at most 70ch.
- **Examples:** Faint Rule rows: the sentence in Chalk in the kana face at 1.2rem with Speak on the right, the translation in Dim Silver below.
- The one amber `.btn` is "Học bài n" (to /lessons/n). Under it a pager on a Faint Rule top border holds the previous and next patterns as text actions with Arrows, previous on the left and next on the right.

### Review queue (/review)
One shared Leitner queue for kana, kanji and vocab, built on the flashcard layout (`flashcards.module.css`) with additions in `review.module.css`. The queue is the due items, fixed when the local deck first loads; a miss appends the item to the end. `?kind=kana|kanji|vocab` narrows it to one kind (unknown values are ignored) and `?lesson=n` to one lesson (an unknown or empty lesson is a 404). A lesson queue also takes that lesson's never-started items, and when nothing there is due or new it runs the whole lesson again as practice. The toolbar names the scope (Mọi mục đến hạn, or Bài n · title) and, when narrowed, carries an Ôn tất cả text action.
- **Header:** with no card showing it is the standard heading and lede. While a card is up the header goes compact: the `h1` drops to Silver 1.75rem and the lede is hidden, so the page is the card. The lede returns with the panels.
- **Status line:** "Còn n mục · Kana x · Kanji y · Từ vựng z" (kinds with nothing left are dropped), tabular and `aria-live`, beside the 3px amber `progress` bar of answered over queued.
- **Card:** the flashcard frame (Asphalt, Strong Rule edge, 27rem tall, 420ms Y flip, amber border on hover). The front is the glyph in Blue Hot Core with blue glow over a Dim Silver hint line, "<kind tag> · <what to recall> · Chạm để lật" (Hiragana, Katakana, Kanji or Từ vựng; then nhớ cách đọc, nhớ Hán Việt, âm và nghĩa, or nhớ cách đọc và nghĩa). The keyboard hint (Phím cách: lật · 1: chưa nhớ · 2: nhớ rồi) and the 1/2 key marks on the grade buttons show only under `pointer: fine`, so touch screens never see them. The back repeats the glyph in Chalk 1.7rem, then centred label-over-value rows at most 55ch: kana gives Romaji (plus a Cách phát âm note in Vietnamese); kanji gives Hán Việt (left out for a kanji that has none, ADR 009), Âm On, Âm Kun and Nghĩa; vocab gives Cách đọc with romaji, Nghĩa, and a Ví dụ sentence with its translation. The strong answer (romaji, Hán Việt, the vocab meaning) is Chalk 1.5rem.
- **Flip into view:** flipping scrolls the card to `block: nearest`, smoothly unless reduced motion is set. The card's `scroll-margin` (1rem top, 8.5rem bottom) clears the sticky grade bar. Under `max-height: 760px` the faces drop to an 18rem minimum so the front sits above the grade bar on short laptops without scrolling.
- **Grade row:** the sticky flashcard grade row (The Sticky Decision Rule) with the ghost "Chưa nhớ 1" and the amber "Nhớ rồi 2", both disabled until the card is flipped. Below it a per-grade notice in Silver 0.85rem names the item and what happens to it: "水: ôn lại sau 3 ngày."; a miss goes back to the end of today's queue, and a known item returns every 30 days.
- **Panels:** empty ("Chưa có gì để ôn. Học một bài để bắt đầu lịch ôn."), waiting ("Hiện chưa có mục nào đến hạn." with a next-review line, "Lần ôn tới: ngày mai, n mục.") and done ("Xong hàng đợi hôm nay.", with the last grade notice above the panel and the next-review line inside). Each is a `role="status"` block on Wet with a 1px Rule border and clamp(1.5rem, 4vw, 2.5rem) padding, a Chalk 1.4rem title and tabular Silver text. Its actions are the one amber `.btn`, to the first unfinished lesson ("Học bài n" with the Arrow, or the lesson path when none is left), and a text action back to the dashboard (Về bảng điều khiển).
- **Footnote:** a Dim Silver line under the section says the schedule is saved in this browser, plus an alert when local storage cannot be read or written.
- **Nav due count (`ReviewLink`, `.dueCount`):** the Ôn tập nav item is followed by the number of due items, in Dim Silver, weight 400, tabular, 0.45em off the label. It appears only after hydration and only above 0. The number is `aria-hidden`, and screen readers get ", n mục đến hạn" as sr-only text instead.

### Search (/search)
One GET form (`role="search"`), rendered on the server: the query lives in the URL as `?q=`, trimmed and cut to 50 characters, so results can be shared and the back button works. Styles are in `search.module.css`; the heading is the standard Silver `h1` with blue glow over a Dim Silver lede.
- **Form:** a 48rem row. The input is 52px tall on Asphalt with a 1px Strong Rule border, a 2px radius and Chalk text at 1.15rem; hover moves the border to Muted Silver, and focus is the amber outline with an amber border. Beside it is the view's one amber `.btn` ("Tra"), also 52px. Under 700px the two stack and the button runs full width with its label centred.
- **Empty:** with no query, a Dim Silver "try" line of example queries (たべ, taberu, hoc, 日, は) as amber underlined text links, 44px tall, turning Amber Hot Core on hover; the Japanese ones are in the kana face.
- **None:** a Dim Silver `role="status"` line naming the query.
- **Results:** groups in a fixed order (vocab, kanji, grammar, kana, lesson), each a 60rem section with a Chalk 1.1rem `h2` and a tabular Dim Silver "(n)". An sr-only `role="status"` line gives the total. Rows sit on Faint Rule hairlines, each one link at least 56px tall in a four-column grid: the head (kana face, 1.35rem, Chalk; a lesson head is Chalk body text), the Dim Silver parts ending in the meaning in Silver, the Dim Silver label (a level badge "N5" in a 1px Strong Rule box, then " · Bài n"), and the Arrow. The level is always text, never colour alone. Hover is a Wet fill with everything in Amber Hot Core. Under 700px the row collapses to one text column with the Arrow on the right. A vocab row also shows the kanji written form when a kana word matched through it (日曜日 for にちようび), so the hit makes sense.
- **Match mark:** the matched span is a `<mark>` with no fill, Chalk text on a 1.5px Silver underline. It is never amber, because an amber underline means "learned" on kanji tiles and amber text reads as a link.
- **Cap note:** when any group holds 20 rows, a Dim Silver line under the results says only the first 20 per kind are shown.

### Navigation
- **Site bar (`.bar`):** the brand link sits on the left: 言葉 in the sign face with pink glow, then "Kotoba" in Chalk Title tracked 0.08em, plus an sr-only "trang chủ". One `<nav>` follows. Its items are Bài học (/lessons), Ôn tập (/review, with the due-count badge) and Tra cứu (/search), all plain nav links; Thi thử joins them when /test ships. Nav items are Title 600 at 1.1rem in Silver. Hover goes to Chalk with a Rule underline, and the current item is amber text with a 1.5px amber underline.
  - **From 900px up** the nav is a plain row: the Thư viện button, then the account group pushed to the right.
  - **Below 900px** the nav is a `popover="auto"` sheet opened by the `.menuBtn` ghost button (44px). The sheet is full width under the bar, Asphalt with Strong Rule top and bottom borders, and its items are 44px rows. Clicking any link inside closes the sheet and the library popover.
  - **Thư viện (`.libraryBtn`):** a button with a small chevron that opens the `#site-library` popover (Bảng chữ cái, Kanji, Từ vựng, Ngữ pháp; /flashcards counts as Từ vựng). It turns amber through `data-current` when the current page is in the library. The popover is Asphalt with a 1px Strong Rule border, anchored under the button. Its rows are 44px and hover to a Wet fill with Amber Hot Core text. In the phone sheet the button is hidden, the primary links are 1.25rem, and the library links are listed inline below a Rule top border.
  - **Account group (`.account`):** when signed in, it shows the email (Dim Silver, 0.9rem, truncated) as a link to /settings, then Đăng xuất, then VI|EN. When signed out, Đăng nhập replaces the email and Đăng xuất. In the phone sheet the group sits below a Rule top border.
- **Sync status (`.syncStatus`, signed in only, phase 20):** a Dim Silver line in the bar itself, outside the nav, so a failure stays in sight when the phone menu is closed: after the account group from 900px up, between the brand and Menu below (0.8rem, wraps, right-aligned; the brand never shrinks). "Đã lưu", "Chờ lưu n thay đổi" (cards the next push would send) or "Lỗi đồng bộ · Thử lại", where Thử lại is a 44px text button with a Strong Rule underline. `aria-live="polite"`; empty until the deck loads.
- **Site footer (`.siteFooter`):** one Dim Silver 0.85rem line above a Faint Rule top border. It holds the KANJIDIC2 / JMdict / CC BY-SA 4.0 credits and a link to /legal that turns Amber Hot Core on hover.

### Study heatmap (dashboard, phase 20)
"Hoạt động 13 tuần" between the review blocks and "Gần đây". A visible summary line ("x ngày có học · y phút trong 13 tuần", Silver, tabular), then 13 Monday-first week columns of 14px cells with 3px gaps and T2/T4/T6 labels in Dim Silver 0.65rem; days after today are not drawn. One hue on the Night surface, dark to bright: level 0 is Wet with a Faint Rule inset ring, levels 1–4 are amber mixed into Night at 40/62/82/100% (validated with the dataviz ordinal check against Night and Wet). Thresholds live in `src/config/activity.ts` (1, 10, 20, 40 minutes). Every cell is `role="img"` with `aria-label` and `title` "d/m: n phút"; the legend names each level's range in text ("Ít · 0 phút · 1–9 phút · … · 40+ phút · Nhiều", the end caps hidden from screen readers). "Gần đây" stays the table view.

### Progress
- **Bar:** a 3px native `progress` with an amber value on a Rule track, followed by a tabular count.
- **Kana ticks:** a grid of 10px squares. Untouched ticks are Wet with a Rule ring, partial ticks are amber 34% over Night, and done ticks are full amber with glow. A tick changes over 140ms in two steps, like a tube striking, rather than fading.

### Street hero (signature, `/` for guests only)
Rain over a skyline SVG drawn in three depth planes, a train on the elevated line, and hanging signs in pink, blue or silver. An unlit sign sits at 62% brightness. Hover lifts it 4px and warms it, and tapping lights it and splits it into kana with Vietnamese meaning. It has one amber action and a ghost secondary.

### Builder amendments (unratified)
The N5 build relies on these interpretations, but **the user has not confirmed them**, so they are provisional:
- Secondary actions are ghost buttons so each view keeps one amber action. The shipped code already follows this.
- The lesson path is drawn as a train line. Shipped in Phase 11.
- Study routes avoid catalogue grids of cards and badges, and use rows, tables and specimens instead. Superseded by ADR 010: tiles and state tags are allowed where scanning a grid is better.

## Do's and Don'ts

### Do:
- **Do** keep exactly one amber `.btn` per view. Make every other action a ghost button or an underlined text link.
- **Do** reference colours only as `var(--token)` from `globals.css`. Derive new shades with `color-mix()` over existing tokens.
- **Do** set every Japanese string with `lang="ja"` in the kana face.
- **Do** keep readable text at Dim Silver or brighter, and style disabled controls as Dim Silver text on a Rule border with no glow.
- **Do** give every row, link and control a target of at least 44px (48px for buttons and inputs), and keep the global amber `:focus-visible` outline.
- **Do** keep the graded decision reachable: a sticky, opaque Night grade row on long cards.
- **Do** honour reduced motion: no flip rotation, rain drift or flicker.

### Don't:
- **Don't** add a second amber action, or a new action hue, to a view.
- **Don't** use Muted Silver for readable text, disabled controls or "coming soon" labels. It is reserved for the 404 numeral.
- **Don't** put drop shadows on study surfaces. Depth is the elevation scale, and emphasis is glow. `--shadow-float` is for popovers, sheets and dialogs only.
- **Don't** carry the hero's 7px sign radius or 4px ticket radius shapes into study UI. Study UI uses `--radius` and `--radius-sm`.
- **Don't** put an eyebrow or kicker above a page `h1`.
- **Don't** add streaks, XP or count badges for progress. Counts are plain tabular text; a `.tag` names a state or a level only.
- **Don't** let colour be the only channel of a state: every state tag and station mark carries text or a shape too.

## Glossary

Terms the UI uses for study state (ADR 007). Keep each word to its one meaning.

| Vietnamese | English | Meaning | Code |
|---|---|---|---|
| Đã học | Learnt | Answered right at least once (box ≥ 1) | `isLearned` |
| Đã thuộc | Known | 6 spaced reviews right in a row (box ≥ `KNOWN_AT`) | `isKnown` |
| Đến hạn | Due | The review day has come | `due` |

"Nhớ" does not name a state.
