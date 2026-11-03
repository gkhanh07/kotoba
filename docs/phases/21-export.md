# Phase 21: data export

Roadmap: `docs/plan/PLAN.md` §21. Rules: `AGENTS.md` (§8.4: an export holds study progress and profile only).

## Goal
A signed-in learner can download everything the account holds about their study as one JSON file.

## Scope
In: `GET /me/export` in kotoba-be (`AuthGuard`); FE route handler `app/settings/export/route.ts` that calls it with the session cookie's token and answers with an attachment; a link on `/settings`; a sentence on `/legal`.
Out: import; CSV; guest export (a guest's data is only in their browser).

## Behaviour
- **BE** `GET /me/export` → `200 { format: "kotoba-export", version: 1, exportedAt, profile, cards, activity }`:
  - `profile` = the same shape as `GET /me` (email, name, goal, exam, minutes);
  - `cards` = every card as `/progress` returns them (`{ box, due, at, lapses }` by item id);
  - `activity` = the stored log (`{ days: {} }` when none).
  - Never a password hash, session or reset token, user id. No session → 401.
- **FE** `GET /settings/export`: no session cookie → redirect to `/login?next=/settings`; BE 401 → same redirect; BE down → 503 text. Otherwise the BE body as `application/json` with `Content-Disposition: attachment; filename="kotoba-export.json"` and `Cache-Control: no-store`. The browser still never calls kotoba-be.
- **Settings**: a "Dữ liệu" section with a plain download link "Tải dữ liệu học (JSON)" to `/settings/export` and one line saying what the file holds.
- **Legal**: one sentence that the learner can download their data from Settings.

## Acceptance criteria
- **AC-1** BE: with a session, the export has exactly the keys above, the pushed cards and activity, the profile; no `hash`, `password`, `token`, `id`, `userId` anywhere in the JSON. Without one, 401.
- **AC-2** FE: signed in, the link downloads `kotoba-export.json`; its card count equals the cards in this browser's deck and the dashboard's learned + not-learned totals (§7.3 cross-check: the number of card ids).
- **AC-3** Guest → `/settings/export` redirects to `/login?next=/settings`.
- **AC-4** Settings and Legal show the link / sentence; axe clean.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/test/progress.e2e-spec.ts` "export" | supertest |
| AC-2, AC-3, AC-4 | `kotoba-fe/e2e/export.spec.ts` | E2E |

## §7.2 case groups
- Happy path: AC-1, AC-2. Empty: new account → `cards: {}`, `activity: { days: {} }`.
- Broken data: stored activity unreadable → `parseActivity` already returns an empty log.
- Network: BE down → 503 from the route handler (not a broken file).
- Security: no secrets in the file (AC-1); `no-store`; same-origin route; only the cookie's own account.
- Navigation: direct URL as guest → login redirect.
- Concurrency, time, display, large data: N/A (one read; a full N5 deck is ~1k cards).

## Self-review notes
- The route handler logs a kotoba-be failure on the Next server and answers 503 text with `no-store`, so a browser never saves an error page as `kotoba-export.json`.
- `EXPORT_VERSION` lives in `kotoba-be/src/config.ts` (§5.3); the export builds every field by hand instead of spreading the user row, so new columns (hashes, tokens) cannot leak into it.
- The E2E cross-checks the file against this browser's deck (same ids) and the dashboard's learned kana count.
- `reviewer`: PASS. Fixed after review: the Settings link has no `download` attribute (with it a 307 to /login or a 503 would be saved as a file; `Content-Disposition: attachment` already downloads and keeps the page); `settings/export/route.test.ts` covers the attachment headers, the sign-in redirect and the 503 text; the E2E compares every exported card with this browser's card; the card-row mapping is one `cardsOf` shared by `/progress` and `/me/export`.

