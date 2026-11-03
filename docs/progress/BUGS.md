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


## BUG-003: review and flashcard cards have a name that does not contain their visible text
- Severity: High (axe serious, `label-content-name-mismatch`)
- Found: 2026-11-03, phase 16 E2E (`e2e/lapses.spec.ts`), the first E2E to show a card with content in `/review`
- Environment: kotoba-fe `/review` and `/flashcards`, Chromium, both viewports
- Steps: open `/review?lesson=5&kind=vocab` as a guest, run axe.
- Expected: 0 serious/critical. Actual: the card `<button aria-label="Xem đáp án">` contains the word and hints as visible text.
- Root cause: the whole 3D card was the button and its name was an action label unrelated to the faces it contains.
- Attempt 1 (rejected): `aria-hidden` on the faces; axe still counts them as visible text.
- Fix: the card is a `div`; the control is a text-less overlay `<button>` (class `.hit`) with the same `aria-label`, `aria-pressed` and `aria-describedby` → faces. Same pattern fixed in `FlashcardApp` (scan for similar code).
- Regression tests: `e2e/lapses.spec.ts` (axe on a review card), `e2e/smoke.spec.ts` now includes `/flashcards`.
- Commit: `feat(srs): count wrong answers and review often-wrong items`
- Status: FIXED

## BUG-004: kotoba-be cannot boot once a content kind has about 1,000 items
- Severity: High (N4 vocab pushes `vocab.json` past it; the API would not start)
- Found: 2026-11-03, phase 22 (seed timing with 10k synthetic rows)
- Environment: kotoba-be, Prisma 7 + better-sqlite3, Node 24
- Steps: put 999 or more items in one `content/*.json` kind, start the API.
- Expected: the seed runs.
- Actual: `deleteMany({ where: { id: { notIn: ids } } })` fails with P2029 "query parameter limit exceeded" (990 ids work, 999 fail).
- Reproducing test: `kotoba-be/test/content.e2e-spec.ts` › seeds a kind with more items than SQLite takes parameters (failed with P2029 before the fix).
- Root cause: `notIn` puts every JSON id in one statement; SQLite caps bound parameters per statement and Prisma does not split `notIn`.
- Fix: the seed reads the stored ids, finds the ones missing from the JSON in JS and deletes them with `in`, which Prisma batches. Same scan: no other query binds one parameter per content item.
- Commit: see `feat(content): content levels and paging in the API`
- Status: FIXED
