# ADR 010: one visual language from the hero to every study screen

- Status: accepted
- Date: 2026-11-11
- Spec: `docs/tasks/ui-redesign.md`

## Context
The guest hero at `/` (a rainy Tokyo street, neon signs, a train) is strong. Every page after it reads like a data admin tool. The baseline screenshots (spec §1) show:
- narrow 46–60rem columns hugging the left edge of a 1440px screen, with the right 40% empty
- pages that are an `h1`, a hairline rule and a text list
- tiny uppercase labels and low-contrast metadata
- flat rows and inputs with no depth
- neon only in the hero

DESIGN.md's **Light-Not-Lift**, **Rows-not-cards** and **no badges** rules produced that flatness. They were right for a dense first release. They are wrong for grids that a learner scans: kana, kanji, mock test papers, and lesson states.

## Options
- (a) Keep the rules and only tune spacing and type. This is cheap, but the pages stay flat and the hero stays an island.
- (b) Adopt a component library or a new theme. This needs a new dependency and throws away the night-street identity and the token discipline.
- (c) Evolve the shipped system. Keep the palette families, fonts and named rules. Replace Light-Not-Lift with a small elevation scale. Lift rows-not-cards and no-badges only where scanning a grid is better. Give each wide page a second column.

## Decision
(c).

**Elevation scale**
- There are four levels, built from tone, a 1px top-edge highlight and inner hairlines, never from drop shadows:
  - level 0 `--surface-0` (night): the page
  - level 1 `--surface-1` (asphalt): panels, rows and tiles
  - level 2 `--surface-2` (wet): hover and selected surfaces
  - one raised level `--surface-3`, a mix of wet and rule, for the single focused object on a screen (the flashcard, the selected tile's preview)
- The top-edge highlight is `--edge-hi`, an inset 1px line of rule-strong over chalk.
- One soft shadow token, `--shadow-float`, for floating layers only: popover, sheet, dialog.

**Cards and labels**
- Cards and tiles are allowed for scanned grids: kana, kanji, test papers, lesson states, the home product preview.
- Short status labels (`.tag`) are allowed for level and memory state. Each label carries text, so colour is never the only channel.
- Counts stay plain tabular text. There are no XP, streaks, levels-up or rings. The streak stat the Dashboard already ships stays as plain text, and nothing new is added.

**Semantic states**
- Learning states are derived from existing hues:
  - fresh: rule and silver-dim
  - started: cool
  - learned: amber
  - known: amber-core, filled
- Feedback states:
  - success: cool, because green is not in the palette and is not added
  - warning: amber
  - error: neon-soft
- Every state pairs its colour with a word or a shape (an outline ring, a half-filled or filled mark).

**Type**
- Type-scale tokens: `--fs-page`, `--fs-section`, `--fs-card`, `--fs-body`, `--fs-caption`, `--fs-meta`, `--fs-specimen`, `--fs-specimen-lg`.
- Saira Condensed stays for titles and nav. Body copy stays Be Vietnam Pro.
- The page `h1` drops `--glow-cool` for a quieter edge glow, because much-read text should not glow.
- Section headings move from 0.85rem uppercase labels to real `--fs-section` titles.

**Radius and width**
- The study radius grows from 2px to `--radius` 6px for surfaces and `--radius-sm` 4px for controls. The hero's 7px/4px street objects keep their own values.
- Pages use 1440px with purpose: a 2-column layout (main plus side panel) from 1100px. Prose stays ≤ 70ch.

**Motion**
- 150–250ms (`--dur-fast`, `--dur`) for hover, selection and grade feedback.
- Under `prefers-reduced-motion` everything is static, including the flashcard flip rotation and the kana ignite/strike animations.

**Rules kept unchanged:** One Amber Rule, Amber Moves On, Script-Is-Its-Own-Face, Tabular Count, Readable Floor, 44px targets and 48px controls, amber `:focus-visible`, Sticky Decision Rule, dark only, and no rain or skyline on study pages.

## Consequences
- DESIGN.md's Elevation, Shapes and Components sections are rewritten. The old Light-Not-Lift rule is marked superseded by this ADR.
- New tokens live only in `globals.css` `:root`, all from `color-mix()` over existing primitives. There is no new hex and no new dependency.
- Existing tests that assert structure or copy change only where a page group deliberately changes it. The reason goes in that commit's body.
- Missing data the design would like is logged in BACKLOG, not invented: kanji stroke order, grammar sentence-part colouring, and a related-grammar field.
