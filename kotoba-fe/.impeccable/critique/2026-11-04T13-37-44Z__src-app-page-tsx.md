---
target: src/app/page.tsx
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\Administrator\\Desktop\\kotoba\\kotoba-fe\\src\\app\\page.tsx"
target_fingerprint: "sha256:43915d3695321a264bb600e1f5044128da0e588d014cb92ce461e77a439fabae"
target_path: "C:\\Users\\Administrator\\Desktop\\kotoba\\kotoba-fe\\src\\app\\page.tsx"
timestamp: 2026-11-04T13-37-44Z
slug: src-app-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

Target: kotoba-fe/src/app/page.tsx (`/`): guest street hero (Persuade) + logged-in Dashboard (Operate).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 360px: sign tap result (ticket, y=840) is below the 740 fold. Dashboard sync status is good. |
| 2 | Match System / Real World | 3 | Street metaphor is excellent; dashboard h1 opens with こんばんは, unreadable for a zero-kana user; "Hôm nay" vs "Đã học" columns unexplained. |
| 3 | User Control and Freedom | 3 | No traps; onboarding has "Để sau". |
| 4 | Consistency and Standards | 1 | Two amber .btn per view (page.tsx:148+201; Dashboard.tsx:132 + WeakList.tsx:23); amber stat numbers look clickable; due count shown 3x. |
| 5 | Error Prevention | 2 | Storage-failure alert (data.bad) is the last element of the dashboard; landing never says an account keeps progress. |
| 6 | Recognition Rather Than Recall | 3 | Ticket breaks words into kana+romaji; unlit signs give no tap cue on touch. |
| 7 | Flexibility and Efficiency | 3 | Quiz/review keyboard support; dashboard has none, "Tiếp tục học" always /review. |
| 8 | Aesthetic and Minimalist Design | 2 | Hero strong; empty dashboard ~15 zeros, 9 stacked sections; landing paragraphs ~89ch vs 65ch cap. |
| 9 | Error Recovery | 2 | Storage alert offers no recovery action. |
| 10 | Help and Documentation | 2 | reviewNote explains intervals; the "honest" section documents a rule the app does not use. |
| **Total** | | **24/40** | **Acceptable** (guest ≈28, dashboard ≈21) |

## Design Specificity Verdict

LLM: guest hero HIGH (rain, pixel skyline, neon signs ラーメン/くすり/カラオケ/すし/ホテル, train-line route; no template makes this). Below the hero MEDIUM (on-world but describes the old kana-only product). Dashboard LOW–MEDIUM: flat black column, none of the street world; amber KPI row is the generic stats pattern.

Deterministic: markup scan 0 findings; CSS scan of the route's 6 modules 51 advisory findings (font-size 34, color 12, radius 5; page.module.css 31, globals 9, dashboard 7). ~20 font-size hits are false positives (detector reads DESIGN.md frontmatter only, prose documents ranges); sign/ticket shadows, ticket 4px radius, mask alphas are documented → false positives. Real: heatmap.module.css:6 `.days` .65rem (below 0.75rem label floor); 0.92/0.95rem near-duplicates (page:336,367,560,573); hero one-off cluster 1.35/1.45/1.5/1.55rem (page:331,357,466,589); hand-written h1 glows at page:119,123 instead of --glow tokens. Browser overlay: guest 45 / 44 (360), dashboard 7 / 4; dark-glow, radial spotlight, thin-border-wide-shadow are documented language (false positives). Real: `a.brand` 123×34 touch target (<44px) on all views; VI/EN 32×32 on desktop dashboard; landing lede ~89ch. No console errors, no horizontal overflow at 360.

## Priority Issues

1. [P1] Landing copy states a rule and a product that are not true. honestP1/lampCaption (i18n.ts:161,168) + 3-lamp figure (page.tsx:95–99) say 3 correct in a row = remembered; the app counts learned at box ≥ 1 (srs.ts:26) and known at KNOWN_AT = 6. One correct review shows "Kana Đã học 2/224". Also routeH "Hai tuyến đầu tiên đã chạy", Kanji "Sắp có" (page.tsx:181–188), footerB "progress in your browser", Dashboard soonAreas "Ngữ pháp: Sắp có" while kanji, vocab, grammar, lessons, tests and accounts shipped. Fix: one definition of "learned/remembered" used on both surfaces (ADR), rewrite lamp figure to KNOWN_AT lamps, open the Kanji station, add the lesson line, say once that an optional account syncs. Command: clarify.
2. [P1] Wrong denominators. page.tsx:117–119 passes unfiltered kanji.length / vocab.length: an N5 learner sees Từ vựng 0/1272, Kanji 0/625 (N5 has 694 vocab, 103 kanji). Violates the displayed-data rule. Fix: filter totals and learned counts by profile.goal level. Command: harden. (Data bug → BUGS.md.)
3. [P2] Dashboard first viewport, streak and empty state. Streak stat (Dashboard.tsx:122,211) contradicts DESIGN.md "Don't add streaks"; at 360 three stacked stats push "Tiếp tục học" to y=649–697 of 740; empty state ~15 zeros + empty heatmap; h1 falls back to email handle (page.tsx:115); data.bad alert at bottom. Fix: drop streak, CTA under h1, stats as one sentence, hide heatmap/history until first session, no-handle greeting, alert on top. Command: distill.
4. [P2] One-amber-action rule broken on both surfaces and amber used for non-actions: page.tsx:201 second .btn (label says hiragana, goes to generic quiz), WeakList.tsx:23 second .btn, amber .stats dd, amber greeting, amber "Chọn kỳ thi". Fix: secondary → btnGhost, stats/greeting → Chalk/Cool. Command: quieter.
5. [P3] Mobile: sign tap feedback off-screen and no tap affordance; brand link 34px tall; heatmap day labels 10.4px. Fix: ticket directly under the sign band at <700px (768 already does this), one-line "Chạm một biển hiệu" hint, brand ≥44px, .days ≥0.75rem. Command: adapt.

## Persona Red Flags

- Jordan (first-timer): 7-item nav competes with the one hero action; Kanji "Sắp có" contradicts Thư viện > Kanji; never told an account keeps progress.
- Casey (mobile): tap result below fold; dashboard CTA at the bottom edge; review footnote says schedule is "lưu trên trình duyệt này" while logged in and syncing.
- Alex (power user): no dashboard shortcuts, one fixed CTA destination, due count ×3, wrong denominators noticed instantly.
- Vietnamese zero-kana beginner: こんばんは h1 without reading or meaning; must discover the sign tap unaided; the "3 in a row" promise is broken by the app.

## Minor Observations

- Hero h1 and CTAs sit outside <main> (page.tsx:131–154), so skip-to-main skips the h1.
- "Chặng hiện tại: Kana" hard-coded (Dashboard.tsx:210).
- History line prints zero parts ("0 kanji · 0 từ").
- Heatmap legend "Ít … Nhiều" redundant next to explicit ranges.
- Visible email in a.who ellipsised (aria-label has the full value).
- Out of scope: /register goal radios exposed invalid="true" before interaction; PRODUCT.md describes the kana-only first release.

## Questions to Consider

- Is "learned" one correct answer or six? That number is the whole honesty pitch; both surfaces must give the same one.
- Should the dashboard live in the street: the learner's own kana lit as signs instead of a stats column?
- Does a guest Persuade page need the full study nav, or would brand + Đăng nhập + VI|EN convert better?
- With accounts syncing, is "không cần đăng ký" still the lead promise, or "luyện ngay, lưu khi bạn muốn"?
