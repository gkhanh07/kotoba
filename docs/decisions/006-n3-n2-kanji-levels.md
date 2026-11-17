# ADR 006: N3 and N2 kanji levels come from Jonathan Waller's lists

- Status: accepted
- Date: 2026-11-04

## Context
KANJIDIC2 gives each kanji one of the four JLPT levels used before 2010. Old 4 maps to N5 and old 3 to N4, and that mapping is what phases 22–23 shipped (103 N5 + 181 N4 kanji). Old level 2 is N3 and N2 merged: 390 kanji, with no hint of which new level each one belongs to. The JLPT has published no official kanji list since 2010, so any N3/N2 split is unofficial. The roadmap asks for `scripts/levels.txt`, generated from a source that has been settled and committed with a credit.

What was checked (2026-11-04):
- Jonathan Waller's lists on tanos.co.uk (`/jlpt/jlpt3/kanji/` and `/jlpt/jlpt2/kanji/`) are the de facto community lists. Each has 367 kanji. They are unique, and no kanji appears in both lists. The domain no longer resolves (NXDOMAIN), so the pages were taken from the Internet Archive: `https://web.archive.org/web/2023id_/https://www.tanos.co.uk/jlpt/jlpt3/kanji/`, and the same address with `jlpt2`.
- Licence: the archived "Use my data!" page (`https://web.archive.org/web/20231128200421/https://www.tanos.co.uk/jlpt/sharing/`, © Jonathan Waller, updated 2011-10-12) says: "Everything on this site (that I'm not selling), is licenced under Creative Commons "BY". … use anything here however you like (commercial or non-commercial), but credit my site." That is CC BY, and it allows redistribution as long as the site is credited.
- Cross-check: the `jlpt_new` field of davidluzgouveia/kanji-data (MIT; the README says the field comes from Waller's lists) gives the same 367 + 367 kanji, with no difference in either direction.
- Comparison with KANJIDIC2:
  - N3: 339 kanji are old level 2, 2 are old level 1 (掛 幾), 25 are old level 3 (N4 here) and 1 is old level 4 (耳, N5 here).
  - N2: 349 kanji are old level 2, 6 are old level 1 and 12 are old level 3.
  - 51 old-level-2 kanji are in neither list (Waller puts most of them at N1, e.g. 案 異 応 価 基 第).

## Options
1. **Waller's lists, KANJIDIC levels first.** A kanji that KANJIDIC2 already maps to N5 or N4 keeps that level. Otherwise, a kanji on Waller's N3 or N2 list takes that level.
2. **Waller's lists as they are.** This moves the 26 N3 and 12 N2 kanji that are already released at N4/N5 (民 合 市 … 耳) up to N3/N2. It changes the level of released items. Their lessons and the N4 words written with them would break the kanji gate, or would have to be rewritten in kana.
3. **Split old level 2 by a frequency threshold.** No source, and the threshold is arbitrary.
4. **Another list (e.g. a textbook's).** Most are copyrighted. No list with a clear licence was found that is better than Waller's.

## Decision
Option 1. `scripts/levels.txt` holds Waller's N3 and N2 lists exactly as published, with a header that credits the source and the licence. `scripts/kanjidic.ts` maps each kanji by trying three rules in order:
1. A level authored by hand in `EXTRA`.
2. KANJIDIC2 old 4 → N5 and old 3 → N4.
3. The level from `levels.txt`.

So N3 gains 341 kanji: Waller's 367 minus the 26 already taught at N5/N4. The 51 old-level-2 kanji that are on neither list get no level and stay out, as N1 is out of scope.

## Consequences
- No released kanji changes level, so no lesson or word moves and no progress data is touched.
- Kotoba's N3 is "Waller N3 minus what Kotoba already teaches earlier". A learner who compares against tanos.co.uk will find 26 N3 kanji listed under N4/N5 here. This is acceptable, because those kanji are taught earlier, not skipped.
- The lists are unofficial. `/legal` says so and credits Jonathan Waller / tanos.co.uk (CC BY) next to the EDRDG credit. The repo READMEs are still the framework boilerplate, so the README credits are written together with the README rewrite in phase 35, which already lists them.
- `levels.txt` is committed, so `npm run kanjidic` needs no network access for the lists. Phase 31 (N2 kanji) only adds `2` to `INCLUDE_LEVELS`.
