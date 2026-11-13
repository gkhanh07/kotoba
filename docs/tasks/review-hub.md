# Review hub (`/review`)

Direct user request: the flow felt hard to use and pages felt empty. Bare `/review` used to drop straight into a session; it now opens a hub.

## Behaviour
- Bare `/review` shows the hub: today's numbers (due, overdue, remembered), a start link, a card per kind (kana, kanji, vocab) with its due count, and the items often answered wrong.
- `?start=1`, `?kind=`, `?lesson=` and `?weak=1` open a session as before.
- Dashboard "Tiếp tục học" now links to `/review?start=1`.

## AC
- AC-1: Given a new guest, when `/review` opens, then the empty hub and the three queues show.
- AC-2: Given cards with known state, when the hub renders, then due, overdue and remembered equal the values computed from the fixture.
- AC-3: Given the hub, when "Bắt đầu ôn tập" is clicked, then `/review?start=1` opens the session.
- AC-4: Given the dashboard, when "Tiếp tục học" is clicked, then `/review?start=1` opens.

## Tests
Unit `lib/reviewHub.test.ts`, component `ReviewHub.test.tsx`, E2E `e2e/review-hub.spec.ts` (mobile + desktop). Existing specs updated for the new URL.

## Review notes
`daily.spec.ts` still expected `/review$` after click; fixed to `/review?start=1`.
