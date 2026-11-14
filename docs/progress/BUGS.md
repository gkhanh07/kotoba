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
- Reproducing tests: `kotoba-be/content/content.spec.ts` "keeps the Hán Việt readings the review corrected" and "gives every kanji a Hán Việt reading, except the Japanese-made ones"; `kotoba-fe/src/lib/library.test.ts` (`hvRows`, `kanjiTitle`); `kotoba-fe/e2e/vocab-page.spec.ts` (/kanji/込, /kanji/画)
- Fix: `hv` is now authored in `kanji.json` and kept by `kanjidic.ts`, checked against hanviet-pinyin-wordlist (MIT) for all 625 kanji (ADR 009). 156 kanji changed, e.g. 画 Họa/Hoạch, 顔 Nhan, 県 Huyện, 戦 Chiến, 伝 Truyền/Truyện, 払 Phất. 込 has no reading and its page says so.
- Similar places: the detail page, its title and the review card read `hv` through `hvRows`/`kanjiTitle`, so an empty list shows no empty row.
- Commit: `fix(content): author Hán Việt readings from a checked source`
- Status: FIXED

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

## BUG-012: dashboard totals ignore the learner's goal level
- Severity: High (wrong figures on the main screen)
- Found: 2026-11-04, critique of `/`
- Environment: `kotoba-fe/src/app/page.tsx` passes `kanji.length` and `vocab.length`; `kotoba-fe/src/app/Dashboard.tsx`
- Steps: sign in with goal N5, open `/`.
- Expected: Từ vựng 0 / 694, Kanji 0 / 103.
- Actual: Từ vựng 0 / 1272, Kanji 0 / 625. The total moves away from an N5 learner with every level added.
- Reproducing test: `kotoba-fe/e2e/home.spec.ts` › an N5 dashboard shows the N5 totals; `kotoba-fe/src/app/Dashboard.test.tsx` › counts only items in the scope.
- Root cause: `page.tsx` loads every level and passes the raw lengths, written when N5 was the only level; phase 22 added levels and kept them. Numerators count every stored card, so other levels and stale ids could also push them past the total.
- Fix: `goalScope` keeps the items of the goal's cumulative scope (ADR 007). The dashboard takes the ids in scope, and numerator and denominator both come from them.
- Status: FIXED
- Commit: `fix(dashboard): count totals by the goal's scope and correct the landing copy`

## BUG-013: broken stored data is overwritten without a copy
- Severity: Critical (data loss)
- Found: 2026-11-05, reading `kotoba-fe/src/lib/store.ts` and `activity.ts` for the store hardening task; PLAN named the `syncState` case
- Environment: `read`/`write`, `syncState`, `resetDeck`, `applyRemote` in `store.ts`; `logActivity` in `activity.ts`
- Steps: put text that does not parse in `kotoba.srs.v1`, open `/kana`, answer a question.
- Expected: the broken text stays somewhere it can be recovered from.
- Actual: the deck is written over it and the text is gone. The same happens to the activity log. Sync data with one bad field loses `owner` and every queued reset. A failed `forget` write still resets the deck, and a failed write inside `applyRemote` leaves a mix of two accounts' keys.
- Reproducing tests: `kotoba-fe/src/lib/store.test.ts`, `activity.test.ts`, `src/app/SyncStatus.test.tsx`
- Root cause: reading treated "cannot parse" the same as "nothing stored", so the next write looked safe; and the writes around a reset or a pull were separate steps whose failures were ignored.
- Fix: `lib/broken.ts` keeps the first unreadable text in `<key>.broken` before a write replaces it, and a failed copy stops the write. `syncState` keeps the valid fields and sets `lastSync` to 0. `resetDeck` changes nothing if the entry cannot be queued. `applyRemote` restores the old values and returns false (ADR 008).
- Similar places: `learnedToday` and the daily counter in `review` stay as they are (bookkeeping, ADR 004).
- Commit: `fix(store): keep stored data that cannot be read or written`
- Status: FIXED

## BUG-014: 中 lacks the on reading ジュウ
- Severity: High (incomplete reading on the kanji card)
- Found: 2026-11-08, first content sample sheet (seed 20261105)
- Environment: `kotoba-be/content/kanji.json`, generated by `scripts/kanjidic.ts`
- Steps: open `/kanji/中`.
- Expected: on readings チュウ and ジュウ (世界中, 一日中).
- Actual: only チュウ.
- Reproducing test: `content.spec.ts` "gives 中 the on reading ジュウ of 世界中 (BUG-014)"
- Root cause: KANJIDIC2 gives 中 only チュウ (checked in `.cache/kanjidic2.xml.gz`), and the script took its on readings as complete.
- Fix: `EXTRA_ON` in `kanjidic.ts` adds it, so a regeneration keeps it.
- Commit: `fix(content): author Hán Việt readings from a checked source`
- Status: FIXED

## BUG-015: すく gives "vắng người" for 空く without saying when
- Severity: Medium (the meaning is right but misleading)
- Found: 2026-11-08, first content sample sheet (seed 20261105)
- Environment: `kotoba-be/content/vocab.json` `vocab:すく`
- Expected: the two uses told apart: おなかがすく (hungry), and a train or seats getting less crowded.
- Actual: "(bụng) đói; vắng người".
- Reproducing test: `content.spec.ts` "separates the two uses of すく (BUG-015)"
- Root cause: the meaning was written from the example only.
- Fix: "đói (bụng); vắng, bớt đông (tàu xe, chỗ ngồi)".
- Commit: `fix(content): author Hán Việt readings from a checked source`
- Status: FIXED

## BUG-016: the causative structure gives only に
- Severity: High (teaches a wrong rule)
- Found: 2026-11-08, first content sample sheet (seed 20261105)
- Environment: `kotoba-be/content/grammar.json` `grammar:shieki`
- Expected: に with a transitive verb (子どもに 野菜を 食べさせる), を with an intransitive one (学生を 帰らせる).
- Actual: "A は B に V-(さ)せる" only, and every example uses a transitive verb.
- Reproducing test: `content.spec.ts` "marks the causative person with に or を by verb type (BUG-016)"
- Root cause: the structure was written from the transitive examples.
- Fix: both structures, plus the example 先生は 学生を うちへ 帰らせました。
- Similar places: no other grammar point states a causative structure.
- Commit: `fix(content): author Hán Việt readings from a checked source`
- Status: FIXED

## BUG-017: the outage page has no document title
- Severity: Medium (a11y; axe "serious" document-title, no data impact)
- Found: 2026-11-12, UI redesign group 10, new outage e2e
- Environment: `kotoba-fe/src/app/error.tsx`, production build, BE stopped
- Expected: the tab and screen readers name the page "Mất điện một lúc", like `global-error.tsx` does.
- Actual: no title when the page's own metadata also needed kotoba-be (axe: document-title, serious); otherwise the failed page's title ("Kanji N5 · Kotoba") over an outage message.
- Reproducing test: `e2e/redesign.spec.ts` "the outage page hangs 停電 on the same unlit board, with one way to retry and a title (BUG-017)"
- Root cause: an error boundary is a client component and cannot export `metadata`; the segment's title came from the page that failed to render, so nothing set one.
- Fix: render `<title>{t.title}</title>` in `error.tsx` (React hoists it into `<head>`), as Next 16's docs recommend.
- Similar places: `global-error.tsx` already renders its title; `not-found.tsx` exports metadata. No other error boundary exists.
- Commit: `feat(ui): redesign the site frame`
- Status: FIXED

## BUG-018: the mock test intro promises the attempt survives closing the page
- Severity: High (wrong promise about the learner's work; closing the tab loses it)
- Found: 2026-11-14, user walkthrough of /test/n5-1
- Environment: `kotoba-fe/src/lib/testText.ts` `startNote`
- Expected: the copy says what really happens: a reload keeps the answers and the clock, closing the tab loses the attempt in progress.
- Actual: "…vẫn tiếp tục nếu bạn đóng trang", while the attempt lives in `sessionStorage` (`kotoba.test.<id>`), which the browser drops with the tab.
- Reproducing test: `TestApp.test.tsx` "tells the learner a reload keeps the attempt and closing the tab loses it (BUG-018)"
- Root cause: the copy was not checked against the store: the attempt is kept in sessionStorage, which survives a reload but not closing the tab.
- Fix: new vi/en `startNote`. Behaviour unchanged (keeping a half-done paper across tabs is a feature, not a bugfix).
- Similar places: `storageWarn` already says reload or close loses it, which is right when storage is blocked.
- Commit: `fix(test): reopen the last result and correct the start note`
- Status: FIXED

## BUG-019: the saved result of a paper cannot be opened again
- Severity: Medium (the result is stored but unreachable; workaround: sit the paper again)
- Found: 2026-11-14, user walkthrough of /test/n5-1
- Environment: `kotoba-fe/src/app/test/[id]/TestApp.tsx`
- Expected: after leaving the result, the paper's intro offers the last score and a way back to its result and wrong-answer review.
- Actual: the list shows "Lần gần nhất 3/6"; the intro only offers Start, and the stored answers are never shown again.
- Reproducing test: `TestApp.test.tsx` describe "last saved result (BUG-019)", 3 tests (offer, open without re-saving, ignore a result of a different paper size).
- Root cause: the result stage was reachable only from a just-finished run; `readResults` was used by the list and dashboard, not by the paper.
- Fix: the intro reads the saved result (only if its answer count matches the paper) and opens the result stage from it without saving again.
- Similar places: retry results are deliberately not saved (retryNote), so nothing else to reopen.
- Commit: `fix(test): reopen the last result and correct the start note`
- Status: FIXED

## BUG-020: the /lessons lede says the path ends at N5 review
- Severity: Medium (wrong copy; the path runs on to N3)
- Found: 2026-11-14, user walkthrough of /lessons
- Environment: `kotoba-fe/src/lib/library.ts` `lessons.lede`, `kotoba-fe/src/app/lessons/page.tsx`
- Expected: the lede names the furthest level the lessons reach (N3 today).
- Actual: "81 bài, từ bảng chữ đến ôn tập N5…" while lessons 33–81 are N4 and N3.
- Reproducing test: `library.test.ts` "lessons lede (BUG-020)"; e2e `levels.spec.ts` "/lessons groups the path under an N5 heading" asserts the lede from the data.
- Root cause: the lede was written when the path was N5 only and hard-coded the level.
- Fix: `lede(n, last)` takes the level label of the last lesson; the page passes it for both the description meta and the paragraph.
- Similar places: the landing copy counts lessons without naming a level; no other hard-coded "N5 review" text.
- Commit: `fix(ui): name the last level in the lessons lede and title detail 404s`
- Status: FIXED

## BUG-021: a missing word, kanji, grammar point or lesson gets the home page title on its 404
- Severity: Low (the page is a correct 404, only the tab title is wrong)
- Found: 2026-11-14, user walkthrough of /lessons/999
- Environment: `generateMetadata` of `vocab/[word]`, `kanji/[char]`, `grammar/[slug]`, `lessons/[n]`
- Expected: tab title "Không tìm thấy trang · Kotoba", as for any unknown URL.
- Actual: "Kotoba · Học tiếng Nhật cho người Việt".
- Reproducing test: `e2e/layout.spec.ts` "<route> is a 404 titled as one" for 5 routes (4 failed before the fix).
- Root cause: `generateMetadata` returned `{}` for a missing item, so the root layout's title won before the page called `notFound()`.
- Fix: `generateMetadata` calls `notFound()` itself, so the not-found metadata applies.
- Similar places: the four detail routes are all the dynamic routes with item metadata; all fixed.
- Commit: `fix(ui): name the last level in the lessons lede and title detail 404s`
- Status: FIXED

## BUG-022: the guest landing page has no data credit or link to the legal page
- Severity: Medium (licence attribution for KANJIDIC2/JMdict, CC BY-SA, missing on the most visited page)
- Found: 2026-11-14, user walkthrough of /
- Environment: `kotoba-fe/src/app/page.tsx`, guest branch
- Expected: like every other page, the footer credits KANJIDIC2 and JMdict under CC BY-SA 4.0 and links /legal.
- Actual: the landing renders its own footer with the tagline only; no credit, no /legal link.
- Reproducing test: `e2e/home.spec.ts` "the landing page opens every line and says an account is optional" (footer assertions).
- Root cause: the landing's own footer replaced `SiteFooter` and did not carry its credit line.
- Fix: the landing footer adds the same credit line from `dict(lang).footer`.
- Similar places: every other page (and the signed-in dashboard) renders `SiteFooter`.
- Commit: `fix(home): credit the data sources on the landing page`
- Status: FIXED

## BUG-023: keyboard hints show on touch screens
- Severity: Low (noise on phones, no wrong behaviour)
- Found: 2026-11-14, user walkthrough on a 360px phone
- Environment: `/kana?mode=quiz` (kbd on the choices and on "Chữ tiếp theo"), `/test/[id]` ("Phím tắt" panel)
- Expected: as flashcards' KeyHelp, key hints show only with a fine pointer (a mouse).
- Actual: the kana quiz and the mock test show 1–4 / Enter hints and the shortcut panel on touch screens.
- Reproducing test: `e2e/keyboard-hints.spec.ts` (2 tests; failed on mobile before the fix).
- Root cause: the hint styles had no pointer media query; only flashcards hid them.
- Fix: `@media not (pointer: fine)` hides `.choice kbd`, `.kbdOnBtn` (kana) and `.help` (test).
- Similar places: flashcards already does this; no other page renders kbd hints.
- Commit: `fix(ui): hide key hints on touch and put the test question before the palette`
- Status: FIXED

## BUG-024: on a phone the mock test question starts below the fold
- Severity: Medium (every question needs a scroll past 45 palette buttons)
- Found: 2026-11-14, user walkthrough of /test/n5-1 at 360×740
- Environment: `kotoba-fe/src/app/test/[id]/TestApp.tsx`
- Expected: after Start, the question and all its choices are inside the first screen; the palette comes after.
- Actual: the 45-button palette came first; the last choice ended at y=954 on a 740px screen.
- Reproducing test: `e2e/test.spec.ts` "the question and its choices come before the palette, within the first screen" (failed on mobile and desktop before the fix).
- Root cause: the palette `<nav>` was rendered before the question card.
- Fix: the palette moves after the question and its moves; `.palette` gets 1.5rem top margin.
- Similar places: the review screen lists questions without a palette; no other page has one.
- Commit: `fix(ui): hide key hints on touch and put the test question before the palette`
- Status: FIXED

## BUG-025: a guest sent to sign in is told signing in is optional
- Severity: Low (confusing copy, the redirect itself works)
- Found: 2026-11-14, user walkthrough as a guest opening /settings
- Environment: `kotoba-fe/src/app/(auth)/forms.tsx` `LoginForm`
- Expected: when a page that needs an account redirects to `/login?next=…`, the login page says that page needs an account.
- Actual: the lede always read "Đăng nhập là không bắt buộc…", so the guest was not told why they landed there.
- Reproducing test: `e2e/export.spec.ts` "a guest opening /settings is told the page needs an account" (failed before the fix).
- Root cause: `LoginForm` rendered `t.login.lede` regardless of `next`.
- Fix: with `next` set, the lede is the new `login.needed` text (vi/en in `src/lib/account.ts`); plain `/login` keeps the old lede.
- Similar places: every redirect to login (`settings/page.tsx`, `settings/actions.ts`, `settings/export/route.ts`) passes `next`, so all are covered.
- Commit: `fix(auth): tell a redirected guest the page needs an account`
- Status: FIXED
