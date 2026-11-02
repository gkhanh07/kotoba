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
---

# Design System: Kotoba

<!-- Scan of the shipped build, 2026-11-02. Sources: src/app/globals.css (every colour token), src/app/layout.tsx (fonts), page.tsx + Dashboard, kana/*, flashcards/*, (auth)/*. Descriptive names and the North Star below are drafted by the documenter from the direction contract and are not yet confirmed by the user. -->

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
- **Sodium Amber Tube** (amber): the one action colour. It is used for the `.btn` outline and fill, the current nav link, the active segment, the focus ring, the caret, and progress (meter counts, mastered kana, `progress` bars). It also marks earned state, such as a learned cell's character.
- **Amber Hot Core** (amber-core): the hover state of amber text links and the centre of the hero's amber headline line.

### Secondary
- **Sign Pink Tube** (neon): the sign being read. It is used for the kana quiz specimen glow, the hero signs, `::selection`, and armed or destructive states.
- **Sign Pink Soft** (neon-soft): form error text and the armed reset label.
- **Sign Pink Core** (neon-core): the brand mark 言葉 and the core of pink sign lettering.

### Tertiary
- **Train-Line Blue Tube** (cool): blue glow (`--glow-cool`) on page `h1`s and study-card words, and the light that spills from cool signs.
- **Blue Hot Core** (cool-core): the flashcard front word and the hero's cool headline line.

### Neutral
- **Night** (night): page ground, the opaque backing of the sticky grade row, and text on amber fills.
- **Asphalt** (asphalt): raised surfaces such as study cards, kana cells, inputs and segments.
- **Wet Asphalt** (wet): hover fill for rows, cells and ghost buttons. Planned panels also use it (review done-state, reading passages).
- **Blue Hour / Falling Dusk / Night Sky** (sky-1, sky-2, sky-3): only the hero sky gradient, the skyline planes (via color-mix), and the sky bleed at the top of /kana.
- **Faint Rule** (rule-dim): row dividers inside tables and lists, the section tops on /settings and /legal, and the footer rule.
- **Rule** (rule): default borders, section dividers, ghost-button edges, disabled borders, and the progress track.
- **Strong Rule** (rule-strong): card edges and ghost-button hover rings.
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

There is one content edge for the whole site. `--pad-x` is `calc(gutter + max(0px, (100% - 88rem) / 2))`, with `--gutter` at clamp(16px, 4vw, 56px). Full-bleed bands and text columns align to it. Pages pad clamp(1.5rem, 4vw, 3.5rem) at the top and 4rem to 5rem at the bottom. Reading and drilling columns narrow inside it. The flashcard study column is 48rem and centred, the Dashboard is 60rem, and auth panels are 26rem.

Study structure is rows and rules. Study sections are separated by 1px Rule borders (`border-top` or `border-block`); the quieter frame pages (/settings, /legal, the footer) use Faint Rule. Tables and lists divide rows with Faint Rule lines. Every row and link has a target of at least 44px, and form controls and buttons are 48px.

Breakpoints are 900px (the site nav becomes the Menu popover sheet, kana chart and quiz go to one column, and the kana detail panel becomes a sticky bottom sheet), 560px (segments become 2-up grids) and 480px (tighter card and table sizes).

**The Sticky Decision Rule.** On a long graded surface the one decision stays reachable. The flashcard grade row is `position: sticky; bottom: 0` with an opaque Night background and a Rule top edge, so the card back can scroll past without hiding Chưa nhớ / Nhớ rồi. The kana detail panel does the same on phones.

## Elevation & Depth

Study surfaces are flat. Depth comes from tonal steps (Night to Asphalt to Wet) and hairline rules, not shadows. The only light is neon. Glows are emitted by text (`text-shadow`) and by active controls. The hero street is the exception: signs carry layered halos and drop shadows, and the hero's ticket panel has a soft drop shadow, because they are physical objects hanging in the scene.

### Shadow Vocabulary
- **Amber glow** (`--glow-amber`): mastered kana, the selected chart cell and lit progress ticks.
- **Pink glow** (`--glow-neon`): the brand mark and the kana specimen being read.
- **Blue glow** (`--glow-cool`): page `h1`s and the flashcard word.
- **Button halo** (`.btn`: inset 0 0 18px amber 12% plus 0 8px 30px -12px amber 50%): the resting amber action. On hover it becomes a 1px amber ring plus 0 10px 40px -8px amber 65%.
- **Sheet lift** (0 -12px 30px night 80%): only the sticky kana detail panel on phones.

### Named Rules
**The Light-Not-Lift Rule.** Study UI never floats on drop shadows. Something matters because it glows, and something is a surface because it is a tone step.

## Shapes

Shapes are hairline and squared. Buttons, cards, inputs and choice chips use a 2px radius (`hairline`). Borders are 1px for structure and 1.5px for controls (`.btn`, `.langSwitch`, nav underline). Circles appear only as small lamps and dots (kana progress lamps, hero lamps). Hanging hero signs use the 7px `sign` radius, and hero ticket panels use 4px. Those softer corners belong to street objects and do not carry over to study UI. The single icon is the Arrow: an 18px SVG with a 1.75 stroke and square caps.

## Components

### Buttons
Buttons are framed tubes that light up when touched.
- **Shape:** squared, with a hairline 2px radius and a 1.5px border. Minimum height 48px, padding 0 1.4em, set in the Title face.
- **Primary (`.btn`):** an amber outline with amber text, a faint amber text-shadow and an inset halo at rest.
- **Hover / Active / Pressed:** fills solid amber with Night text and a stronger halo, over 0.25s `--ease-out`. Focus is the global 2px amber outline at a 3px offset.
- **Ghost (`.btn btnGhost`):** a Rule border and Silver text with no glow. On hover it gets a Wet fill, Chalk text and a Strong Rule ring.
- **Disabled:** Rule border and Dim Silver text, with no fill, no glow and `cursor: not-allowed`.
- **Text action:** an amber underlined link with a 0.25em offset that goes to Amber Hot Core on hover. Examples are the flashcard tools and Dashboard links. Disabled text actions use Dim Silver.

### Segmented controls
- **Language switch (`.langSwitch`):** a 1.5px Rule frame with Title 0.85rem buttons. The pressed button is solid amber with Night text.
- **Kana group segments:** a 1px Rule frame on Asphalt with 44px links. The current link is solid amber with Night text, and hover gives a Wet fill. Below 560px it becomes a 2-up grid.

### Cards / Containers
- **Study card (flashcard):** Asphalt with a 1px Strong Rule border and a 2px radius, at least 27rem tall. It flips 420ms on Y, and reduced motion removes the rotation. Hover turns the border amber. The front word is Blue Hot Core with blue glow.
- **Kana cell:** Asphalt with a 1px Rule border. Hover gives Wet and a Dim Silver border. Selected gets an amber border plus an inset amber ring and glow. When mastered, the character turns amber with glow.
- There are no nested cards. Study routes use rows, tables and specimens.

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
There are four sections (profile, language, password, delete account), each its own form with its own result line. They sit in a 40rem column, separated by Faint Rule top borders with 2rem padding. Section `h2`s are Chalk at 1.25rem. The profile save is the view's amber action and stays disabled until a field changes. Changing the password uses a ghost button.

### Status pages (`.statusPage`: not-found, error, global-error)
Each is an unlit sign, one line and one way out. The layout is a left-aligned grid in a 40rem column with 1.25rem gaps. The mark above the heading is `.statusMark`, set in the sign face at clamp(4.5rem, 16vw, 9rem) with no glow:
- **404:** the numeral is the `h1`, in Muted Silver. This is the only use of Muted Silver.
- **Outage (`error.tsx`):** the mark is 停電, a sign that has gone dark. It carries `lang="ja"`, `aria-hidden` and `[data-off]`, and is Dim Silver. `global-error.tsx` replaces the root layout, so it has no mark and its fonts fall back.
- The heading is Chalk at clamp(1.6rem, 4vw, 2.25rem), and the body is Dim Silver at most 34rem wide. On the error pages `role="alert"` wraps only the heading and body, not the mark or the button. The single action is the amber `.btn`: home on the 404, retry on the error pages.

### Legal (/legal)
A 68ch reading column of Silver text at line-height 1.7. It has a Chalk `h1`, a Dim Silver "updated" line, then an in-page contents list of 44px links. Each section has a Faint Rule top border and a Chalk 1.35rem `h2`. Links on the page are Silver with a Strong Rule underline, and on hover they go to Chalk with a currentColor underline. There is no amber action.

### Navigation
- **Site bar (`.bar`):** the brand link sits on the left: 言葉 in the sign face with pink glow, then "Kotoba" in Chalk Title tracked 0.08em, plus an sr-only "trang chủ". One `<nav>` follows. Nav items are Title 600 at 1.1rem in Silver. Hover goes to Chalk with a Rule underline, and the current item is amber text with a 1.5px amber underline.
  - **From 900px up** the nav is a plain row: the Thư viện button, then the account group pushed to the right.
  - **Below 900px** the nav is a `popover="auto"` sheet opened by the `.menuBtn` ghost button (44px). The sheet is full width under the bar, Asphalt with Strong Rule top and bottom borders, and its items are 44px rows. Clicking any link inside closes the sheet and the library popover.
  - **Thư viện (`.libraryBtn`):** a button with a small chevron that opens the `#site-library` popover (Bảng chữ cái, Thẻ từ vựng). It turns amber through `data-current` when the current page is in the library. The popover is Asphalt with a 1px Strong Rule border, anchored under the button. Its rows are 44px and hover to a Wet fill with Amber Hot Core text. In the phone sheet the button is hidden and the library links are listed inline.
  - **Account group (`.account`):** when signed in, it shows the email (Dim Silver, 0.9rem, truncated) as a link to /settings, then Đăng xuất, then VI|EN. When signed out, Đăng nhập replaces the email and Đăng xuất. In the phone sheet the group sits below a Rule top border.
- **Site footer (`.siteFooter`):** one Dim Silver 0.85rem line above a Faint Rule top border. It holds the KANJIDIC2 / JMdict / CC BY-SA 4.0 credits and a link to /legal that turns Amber Hot Core on hover.

### Progress
- **Bar:** a 3px native `progress` with an amber value on a Rule track, followed by a tabular count.
- **Kana ticks:** a grid of 10px squares. Untouched ticks are Wet with a Rule ring, partial ticks are amber 34% over Night, and done ticks are full amber with glow. A tick changes over 140ms in two steps, like a tube striking, rather than fading.

### Street hero (signature, `/` for guests only)
Rain over a skyline SVG drawn in three depth planes, a train on the elevated line, and hanging signs in pink, blue or silver. An unlit sign sits at 62% brightness. Hover lifts it 4px and warms it, and tapping lights it and splits it into kana with Vietnamese meaning. It has one amber action and a ghost secondary.

### Planned (not yet built)
These exist only in `.impeccable/mocks/n5-ia.md` and are not shipped components. Do not treat them as established:
- The primary nav items Bài học, Ôn tập (with a due count), Tra cứu and Thi thử. Each joins the shipped nav when its route ships.
- The /lessons train-line path with station marks, /lessons/[n], the /review queue that reuses the flashcard frame, /search, /test sitting, result and review, the /kanji grid and detail, /vocab decks and /grammar.
- Play, chevron and clock icons drawn to match the Arrow.

### Builder amendments (unratified)
The N5 build relies on these interpretations, but **the user has not confirmed them**, so they are provisional:
- Secondary actions are ghost buttons so each view keeps one amber action. The shipped code already follows this.
- The lesson path is drawn as a train line (planned).
- Study routes avoid catalogue grids of cards and badges, and use rows, tables and specimens instead. The shipped code already follows this.

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
- **Don't** put drop shadows on study surfaces. Depth is tonal, and emphasis is glow.
- **Don't** carry the hero's 7px sign radius or 4px ticket radius into study UI. Study UI uses the 2px hairline.
- **Don't** put an eyebrow or kicker above a page `h1`.
- **Don't** add streaks, XP, badges or pills for progress. Counts are plain tabular text.
