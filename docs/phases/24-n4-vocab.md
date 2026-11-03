# Phase 24: N4 vocabulary (batches 24a, 24b, 24c)

Roadmap: `docs/plan/PLAN.md` "24. Từ vựng N4" and the shared content checks. Rules: `AGENTS.md` §12.

## Goal
About 650 N4 words in lessons 26–44, in batches of ~200, one commit per batch, each batch through the full gate.

## Scope
Per batch:
- New `vocab.json` entries, same shape as N5 (`id: vocab:<word>`, word, reading, romaji, vi, en, example {ja, vi, en}, optional notes, lesson, `level: 4`, `reviewed: false`). Ids are new; no N5 entry changes.
- **Kanji gate:** every kanji in `word` is in `kanji.json` at level 5 or 4; otherwise `word` is in kana and the usual spelling goes in `kanji`.
- **No duplicates** with existing words (same written form + reading), and not the homophone ids already blocked in BACKLOG (an id `vocab:<word>` must be unique).
- **JMdict:** every (word or kanji spelling, reading) pair passes `npm run jmdict`; examples use the word and use N5/N4 grammar and vocabulary.
- Words of a lesson fit its theme; each N4 lesson 26–44 ends with roughly 30–40 words over the three batches.
- Batch split: **24a** lessons 26–32, **24b** lessons 33–38, **24c** lessons 39–44.
- `content.spec.ts` inventory gets the new exact vocab counts (N5 694 + N4 n).

Out: grammar (25), mock test (26).

## Acceptance criteria (each batch)
- **AC-1** `npm run validate:content` (content spec + JMdict) passes; inventory counts exact.
- **AC-2** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass (fixed counts updated with the reason).
- **AC-3** Screenshots of `/vocab?level=4` and one filled N4 lesson page at 360 and 1440, looked at.
- **AC-4** Every new word `reviewed: false`; the batch report lists the words the author is unsure belong to N4.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/content/content.spec.ts`, `scripts/jmdict-check.ts` | Vitest / script |
| AC-2, AC-3 | full suites; `e2e/levels.spec.ts` / `e2e/vocab.spec.ts` | E2E |

## §7.2 case groups
Content: happy path, wrong data (gate, duplicates, JMdict), display (long meanings in decks and the word page). Others N/A.

## Self-review notes
- **24a** (lessons 26–32): 178 words (26: 35, 27: 17, 28: 27, 29: 24, 30: 17, 31: 29, 32: 29). Short of ~200 on purpose: most basic season and food words are already N5 (in kana), and a kanji spelling of them would put one word in two levels. Skipped homophones (id collision): かぜ 風邪, かみ 髪/紙, かた 肩, なく 泣く, は 葉, なくなる. Ids now taken: `vocab:かわく` (乾く), `vocab:なおる` (治る), `vocab:ちゅうしゃ` (注射), `vocab:かう` (飼う), `vocab:おこる` (怒る). Unsure-N4 list in the batch report (赤 青 黒 白 as nouns, これから, ちょうど, いっぱい, 先, たまに, もうすぐ, どうぶつえん, 牛, もえる, ゆか, たな, かぐ, 地下, 年, げしゅく, 食料品, きょうみ). Examples keep to N5/N4 kanji (星 島 虫 written in kana).
- Tests changed by 24a: `e2e/vocab.spec.ts` checks /vocab per level (N5 and N4) instead of the whole file on the N5 tab; the BE kanji-detail test derives the words with 水 from the JSON (N5's two first); the 5,000-row paging test compares N5 with the N5 count.
- To save the remaining budget, `reviewer` runs once over the three batches at the end of phase 24 instead of per batch (the full gate still runs per batch).
- **24b** (lessons 33–38): 197 words (33: 28, 34: 36, 35: 36, 36: 28, 37: 34, 38: 35); N4 total 375, file 1,069 (past the ~1,000-item seed limit of BUG-004: boot and e2e pass). Skipped: 寄る (id `vocab:よる` = 夜). Unsure N4 vs N3: 計画 歌手 社員 読み方 転ぶ 市民 人口 地理 ビデオ ドラマ ステレオ 汽車 とこや こうがい 仕方 会場; maybe N5: 意味 東京 京都 ニュース きょうかしょ ヨーロッパ; proper nouns 東京 京都 おおさか kept for review. `vocab:とまる` is 泊まる (止まる keeps its kanji id).
- **24c** (lessons 39–44): 203 words (39: 30, 40: 40, 41: 43, 42: 29, 43: 22, 44: 39); N4 total 578, file 1,272. Skipped homophones (id taken): 優しい 速い 起こる 済む 点く 暮れる 変える 冷める/覚める 機会 訪ねる 煮る 辺 奥 内 約 温かい 端/橋 切る 開く(ひらく). New ids that block future homophones: きかい (機械), たずねる (尋ねる), にる (似る), へん (変), かわる (変わる), せき (席), うつ (打つ), あたり (辺り). The kana-id scheme now blocks many common N4 homophones; the BACKLOG item on an id scheme for same-kana words gets more pressing before N3.
- Unsure (24c): maybe N5 — 開く(あく) しまる 行ってきます 行ってらっしゃい 思う 知る 多分 だから お手洗い そんな あんな まあまあ だいきらい; maybe N3 — 帰国 待ち合わせ 見送る 早起き ねぼう 動かす とどく ふくろ うつ わく 使い方 思い出 にがて じゆう まよう 地方 海外 近道 あちこち 乗り場 せき つきあたり おうだんほどう ゆうえんち はくぶつかん にかいだて はいけん. Meanings to widen later: てきとう (also "qua loa"), わけ (only "lý do").
- `reviewer` over all 578 N4 entries: PASS (romaji, example kanji, word-in-example and N5 clashes checked by script). Fixed: 産業 vi "ngành công nghiệp, ngành sản xuất" (was "ngành nghề, sản nghiệp"); examples of やめる (辞める sense: quitting a company), 市 (city library), 始め (start of a film; 初め's sense needs 初, not in the kanji list), 早起き (そふ, own grandfather); translations of 人口 (50.000) and 帰国 (keeps ことになりました).

