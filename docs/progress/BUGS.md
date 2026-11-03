# Bugs

Format per AGENTS.md §11. Severity: Critical / High / Medium / Low.

<!--
## BUG-001: <short title>
- Severity: High
- Found: <date>, <phase/task>
- Environment: <app, browser/Node, viewport>
- Steps to reproduce:
  1. …
- Expected: …
- Actual: …
- Reproducing test: <file> › <test name> (fails before the fix)
- Root cause: …
- Fix: …
- Commit: <hash>
- Status: OPEN | FIXED
-->

## BUG-001: kana chart cells have an accessible name without their visible text
- Severity: High (axe serious, `label-content-name-mismatch`; voice-control users cannot say what they see)
- Found: 2026-11-03, phase 13.5 smoke E2E
- Environment: kotoba-fe `/kana`, Chromium, 360×740 and 1440×900
- Steps: open `/kana` as a guest, run axe.
- Expected: 0 serious/critical violations.
- Actual: every cell `button[aria-label="あ, đọc là a"]` is flagged: the visible text "あa" is not part of the `aria-label`.
- Reproducing test: `kotoba-fe/e2e/smoke.spec.ts` › guest can open /kana with no axe violations (failed before the fix).
- Root cause: `KanaApp` overrode the button's content with `aria-label`, whose wording put "đọc là" between the two visible parts.
- Fix: drop the `aria-label`; the name now comes from the content, with a `sr-only` ", đọc là " between the kana and the romaji (`cellReads` in `i18n.ts`). Same pattern scanned in other components: only BUG-002 matched.
- Regression test: the axe smoke tests above, plus `smoke.spec.ts` › kana cells and shop signs expose a name that includes their visible text (checks the spoken name).
- Commit: `chore(test): add vitest, rtl and playwright with axe to kotoba-fe`
- Status: FIXED

## BUG-002: the ラーメン shop sign on the home page has a name that does not match its visible text
- Severity: High (axe serious, `label-content-name-mismatch`)
- Found: 2026-11-03, phase 13.5 smoke E2E
- Environment: kotoba-fe `/`, Chromium, both viewports
- Steps: open `/` as a guest, run axe.
- Expected: 0 serious/critical violations.
- Actual: `button[aria-label="ラーメン, Mì ramen"]` flagged: the long mark ー is drawn as an empty bar, so the visible text is "ラメン".
- Reproducing test: `smoke.spec.ts` › guest can open / with no axe violations (failed before the fix).
- Root cause: `Street` rendered ー as a styled empty `span` and named the button with `aria-label`.
- Fix: the drawn glyphs are `aria-hidden`; the name is a `sr-only` text "<word>, <meaning>" (`signMeaning` in `i18n.ts`). Visual output unchanged (screenshots checked).
- Regression test: as BUG-001.
- Commit: `chore(test): add vitest, rtl and playwright with axe to kotoba-fe`
- Status: FIXED
