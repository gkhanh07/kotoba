# ADR 015: Stroke order from KanjiVG, kept in its own file

- Status: accepted
- Date: 2026-11-15

## Context
The user asked for stroke-order animation. KanjiVG is the standard open source of stroke paths, licensed CC BY-SA 3.0 (share-alike).

## Decision
- `kotoba-be/scripts/kanjivg.ts` extracts the paths for our 625 kanji into `content/strokes.json` only, so share-alike applies to that file and not to the rest of the content.
- `GET /content/kanji/:char` returns `paths` (viewBox 0 0 109 109); a kanji missing in KanjiVG has none and the page shows the stroke count only.
- Credit in `/legal`, the site footer and README.
- Animation is CSS only (stroke-dashoffset); under reduced motion the strokes show static and numbered. No handwriting practice or grading.

## Consequences
- One more generated content file; regenerate with `npm run kanjivg` when kanji are added.
