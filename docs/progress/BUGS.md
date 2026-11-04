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

## BUG-005: E2E serves the previous run's content from Next's fetch cache
- Severity: Medium (false E2E failures after any content change; in production new content can take up to an hour to show, which is the chosen `revalidate`)
- Found: 2026-11-03, phase 23 (N4 kanji added, `/kanji?level=4` still empty in E2E)
- Environment: kotoba-fe `next build && next start` under Playwright
- Steps: run `npm run test:e2e`, change `kotoba-be/content/*.json`, run it again.
- Expected: pages show the new content.
- Actual: `.next/cache/fetch-cache` holds `GET /content/kanji?level=4&page=1` = `{ items: [], total: 0 }` from the earlier run (`revalidate: 3600`); the rebuilt app serves it.
- Reproducing test: `kotoba-fe/e2e/levels.spec.ts` › /kanji?level=4 pages the N4 kanji under their lessons (0 tiles before the fix).
- Root cause: the fetch cache lives in `.next/cache`, which `next build` keeps; content is fetched with `revalidate: HOUR`.
- Fix: Playwright's FE webServer deletes `.next/cache/fetch-cache` before building. Production keeps the hourly revalidate (content ships with kotoba-be; a deploy that changes content should clear that folder too — noted in BACKLOG for phase 35's deploy notes).
- Status: FIXED (test environment)

## BUG-006: on screens wider than 88rem, capped pages squeeze their text into a thin column
- Severity: High (the mock test, lesson, grammar, legal and 404 pages become unreadable on a 1920px screen or a zoomed-out laptop)
- Found: 2026-11-04, responsive check with Chrome DevTools (user report: `/test/[id]` shown as a narrow column)
- Environment: kotoba-fe, Chromium, viewport ≥ 1408px (worse as it grows)
- Steps: open `/test/n5-1` at 1920×1080.
- Expected: the column keeps its designed measure (52rem for the test).
- Actual: the text area is 223px; `/test` 208, `/lessons/1` and `/grammar/wa-desu` 127, `/legal` 172, the 404 page 16 (from 1440px they are already 42–49% of the screen).
- Reproducing test: `kotoba-fe/e2e/layout.spec.ts` › <route> keeps a readable column on a wide screen, and › the 404 page keeps a readable column on a wide screen (12 failed before the fix: 127–223px, 16px for the 404).
- Root cause: `--pad-x` (`globals.css:62`) is `gutter + (100% − 88rem) / 2`, made for full-width blocks. The boxes that also cap their own width (`test.module.css:1` `.app`, `legal.module.css:1` `.legal`, `globals.css:388` `.statusPage`, `lessons.module.css:40` `.lesson`, `grammar.module.css:14` `.detail`) took it as padding: the `100%` is the page width, not the box width, so on wide screens the padding grows with the screen while the box stays capped, and the content collapses.
- Fix: the centred boxes (test, legal, status page) pad with `--gutter` and add it to the cap (`max-width: calc(<cap> + 2 * var(--gutter))`, the pattern `dashboard.module.css` already used). The left-aligned detail pages (lesson, grammar) keep `--pad-x` so they line up with the site bar and add it to the cap (`calc(46rem + 2 * var(--pad-x))`). The `--pad-x` comment now says so. Scan: every other `var(--pad-x)` is on a box without a max-width.
- Status: FIXED

## BUG-007: /kana scrolls sideways on desktop browsers with a classic scrollbar
- Severity: Low (8px horizontal scroll, cosmetic)
- Found: 2026-11-04, same responsive check
- Environment: kotoba-fe `/kana`, Chromium on Windows (scrollbar 15px wide), every viewport
- Steps: open `/kana`.
- Expected: no horizontal scroll (AGENTS.md §8.2). Actual: `scrollWidth − clientWidth` = 8px.
- Reproducing test: `kotoba-fe/e2e/layout.spec.ts` › /kana has no horizontal scroll (desktop failed before the fix; the spec turns off headless Chromium's `--hide-scrollbars`, which had hidden the bug from every earlier E2E run).
- Root cause: the sky behind the page (`kana.module.css:11`, `.app::before`) used `inset: … calc(50% - 50vw)` to bleed to the screen edges; `100vw` includes the scrollbar, so it ran past the page on the right. `.app` is already full width, so the bleed was not needed.
- Fix: `inset: -6rem 0 auto`.
- Status: FIXED

## BUG-008: the sync-status E2E cannot stop kotoba-be on Windows
- Severity: Medium (test environment only; the Quality Gate cannot go green on a Windows machine)
- Found: 2026-11-04, full `npm run test:e2e` on Windows Server 2019 during the BUG-006 fix
- Environment: kotoba-fe Playwright, Windows, Git Bash (no `lsof`)
- Steps: run `npx playwright test e2e/sync-status.spec.ts` on Windows.
- Expected: the journey stops kotoba-be, sees "failed", restarts it, sees "saved".
- Actual: `Error: kotoba-be did not go down on :4000` (mobile and desktop).
- Reproducing test: `kotoba-fe/e2e/sync-status.spec.ts` › sync status: saved, failed while kotoba-be is down, saved again after Thử lại (failed on both projects before the fix).
- Root cause: `e2e/backend.ts` finds kotoba-be's process with `lsof` and `ps`; without `lsof` the `catch` returns no process, so nothing is stopped (and the teardown would not stop a restarted backend either).
- Fix: on `win32`, the same lookup with PowerShell (`Get-NetTCPConnection` → `Win32_Process` command line contains `dist?main`). Linux/macOS path unchanged.
- Status: FIXED

## BUG-009: some Hán Việt readings from KANJIDIC2 are wrong (戦 "Khuyết", 伝 "Vân")
- Severity: High (wrong reading shown on the kanji tile and detail page)
- Found: 2026-11-04, phase 27, while authoring the N3 meanings
- Environment: `kotoba-be/content/kanji.json` `hv`, generated by `scripts/kanjidic.ts` from KANJIDIC2 (`<reading r_type="vietnam">`)
- Steps: open `/kanji/戦` or `/kanji/伝`. The phase 27 review found two more: 払 "Chàng" (the common reading is Phất) and 込 "Liêu" (込 is a Japanese-made kanji, so a Hán Việt reading for it is doubtful).
- Expected: the common Hán Việt reading, Chiến for 戦 and Truyền for 伝.
- Actual: Khuyết and Vân. The KANJIDIC2 file itself holds these values (checked in `.cache/kanjidic2.xml.gz`), so the script copies them correctly.
- Root cause: the source data. KANJIDIC2's Vietnamese readings are a contributed field and are not reliable everywhere. The script trusts it for every kanji, so other levels may have the same kind of error.
- Fix: not done. It needs a cited, licensed Hán Việt source to correct against: AGENTS.md §12 forbids inventing readings, and there is none in the repo. The fix would then be an authored `hv` override, kept by `kanjidic.ts` like `vi`, plus a check over all 625 kanji. This is out of phase 27's scope, and the decision about the source is the user's.
- Status: OPEN

## BUG-010: /kanji pages split a lesson's kanji across pages
- Severity: High (a lesson's kanji are shown in pieces on several pages, and N3 page 1 lacks lessons 46–47)
- Found: 2026-11-04, phase 27, by the new N3 e2e test (first heading "Bài 48" instead of "Bài 46")
- Environment: `GET /content/kanji?level=N&page=P` (`kotoba-be/src/content.controller.ts` `list`), shown by `kotoba-fe/src/app/kanji/page.tsx`
- Steps: open `/kanji?level=4`, then `/kanji?level=4&page=2`.
- Expected: pages go lesson by lesson, so each lesson's group is whole or continues on the next page.
- Actual: lesson 26 appears on pages 1 and 2 (N4), lessons 13 and 17 on both N5 pages, and almost every N3 lesson on most of the 4 pages.
- Reproducing test: `kotoba-be/test/content.e2e-spec.ts` › pages kanji lesson by lesson (failed for N5 before the fix).
- Root cause: the list is paged in `sort` order, which for kanji is `kanji.json`'s frequency order (`scripts/kanjidic.ts`), while the page groups each page's slice by lesson. Present since phase 22 (paging), visible once a level filled several pages.
- Fix: a paged kanji list is ordered by lesson, then `sort`. Unpaged lists and other kinds keep `sort` order (vocab and kana are not lesson-ordered in their JSON, and their pages do not group by lesson).
- Status: FIXED

## BUG-011: kanji meanings show XML entities ("coming &amp; going")
- Severity: Medium (wrong text in two English meanings; the Vietnamese meaning is right)
- Found: 2026-11-04, phase 27 review
- Environment: `kotoba-be/content/kanji.json` `en`, generated by `scripts/kanjidic.ts`
- Steps: look at the `en` field of `kanji:交` or `kanji:偶`.
- Expected: "coming & going", "man & wife".
- Actual: "coming &amp; going", "man &amp; wife".
- Reproducing test: `kotoba-be/content/content.spec.ts` › holds no XML entities in kanji text (failed before the fix).
- Root cause: `kanjidic.ts` reads KANJIDIC2 with regexes and copied the XML text as it is, without decoding entities. The file uses only `&amp;` (22 times), two of them in kanji Kotoba includes. Both are N3, so no released kanji had it.
- Fix: `all`/`one` decode the five XML entities in one pass. After re-running `npm run kanjidic`, only those two meanings changed, and a second run makes no diff.
- Status: FIXED
