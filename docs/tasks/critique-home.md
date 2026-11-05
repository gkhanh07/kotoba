# Task: fix from the `/` critique (2026-11-04)

Source: `kotoba-fe/.impeccable/critique/2026-11-04T13-37-44Z__src-app-page-tsx.md`, P1 #1 and #2; `docs/plan/PLAN.md` "Trước 28". Bug: BUG-012. Decision: ADR 007.

- Goal: a learner reads true figures on the dashboard, and a visitor reads true statements on the landing page.
- In scope: dashboard totals and learned counts, the landing copy and lamp figure, the "Sắp có" rows, the "saved in this browser" notes.
- Out of scope: critique P2/P3 (phase 35), "Chặng hiện tại: Kana", due counts (the review queue covers every level, so they stay unscoped).
- Stored data: none changes. `level` was already in the `/content/vocab` payload; only the FE type gains it.

Assumption, beyond the critique's "goal level": the scope is cumulative, because JLPT is cumulative and lessons run through the levels. A learner aiming at N4 also needs N5, so N5 → N5, N4 → N5+N4, N3 → N5–N3. No goal, N2 or N1 (no such content yet) → all content.

## Acceptance criteria

- AC-1. Given goal N5, when the dashboard loads with the real content, then it shows Từ vựng `n / 694` and Kanji `n / 103`.
- AC-2. Given goal N4 / N3 / none / N1, then the totals are the cumulative scope of that goal (`goalScope`).
- AC-3. Given learned cards outside the goal's scope or no longer in content, then they are not counted, so a numerator never exceeds its denominator.
- AC-4. Given the landing page, then `honestP1`, the lamp figure and its caption state `KNOWN_AT` (6) reviews in a row at the `INTERVALS` spacing, and the figure has `KNOWN_AT` lamps.
- AC-5. Given the landing page, then the Kanji station links to `/kanji`, a lesson station links to `/lessons`, nothing says "Sắp có", and the heading counts the open lines.
- AC-6. Given the landing footer, then it says practice needs no account and an optional account syncs between devices. The "saved in this browser" notes say the same.
- AC-7. Given the dashboard, then Ngữ pháp links to `/grammar` and no row says "Sắp có". "Đọc hiểu" is removed: PLAN has no item for it, so "Sắp có" would be an empty promise.

## Test matrix

| AC | Test | Layer |
|---|---|---|
| AC-1 | `e2e/home.spec.ts` › an N5 dashboard shows the N5 totals | E2E, real content |
| AC-2 | `library.test.ts` › goalScope (N5, N4, N3, N1, none) | Unit |
| AC-3 | `Dashboard.test.tsx` › counts only items in the scope | Component |
| AC-4 | `e2e/home.spec.ts` › the landing page states the real rule | E2E |
| AC-5 | `e2e/home.spec.ts` › the landing page opens every line | E2E |
| AC-6 | `e2e/home.spec.ts` › same test (footer) | E2E |
| AC-7 | `Dashboard.test.tsx` › links grammar | Component |

§7.2 N/A: network and storage errors (no new reads; the existing `warning` stays), concurrency, time. Screenshots of `/` and the dashboard at 360 and 1440.

## Steps

1. BUG-012, this spec, ADR 007 → verify: docs written.
2. Failing tests for `goalScope`, Dashboard and `/` → verify: seen failing.
3. `goalScope`, `Vocab.level`, Dashboard `scope` prop → verify: unit and component tests green.
4. Landing copy, lamp figure, stations, CSS → verify: E2E green, screenshots looked at.
5. Quality Gate, commit `fix:`, push, PROGRESS.

## Self review

- Found and fixed: the six lamps of the `known` row took the figure past its right margin at 360px (x 16 to 358.97, margin 16). No element left the viewport, so the first two assertions stayed green. `home.spec.ts` now keeps the figure inside the margin the heading marks.
- Found and fixed by looking at the 901px screenshot, after the spec was green: the lamp labels left the figure (right edge 893.7, figure 865) and wrapped, up to about 1257px wide. The spec measured only the figure. It now also checks the label's right edge and that it stays on one line at 768, 901, 1280 and 1281px, seen failing on desktop, then fixed by the compact lamps in a 1280px media block.
- Found and fixed: `honestP1` took an array, which broke `text.test.ts` (it walks every dictionary function with numbers). It takes a joined string now.
- Beyond the critique: the goal scope is cumulative (see the assumption above, ADR 007), and "Đọc hiểu" is removed.
- Not changed: due counts stay across all levels (BACKLOG, phase 18).
