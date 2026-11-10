# Phase 28: N3 vocabulary (batches 28a–28i)

Roadmap: `docs/plan/PLAN.md` "27–30. N3" (repeat of "24. Từ vựng N4") and the shared content checks. Rules: `AGENTS.md` §12. Starts after the sample review of 2026-11-09 (`docs/tasks/sample-review.md`).

## Goal
N3 words in lessons 46–80, in batches of ~200, one commit per batch, each batch through the full gate. Target about 1,500–1,800 words; a batch may come out shorter when the lessons' themes run out of real N3 words (as 24a did), and the shortfall is reported, not padded.

## Scope
Per batch:
- New `vocab.json` entries, same shape as N4 (`id: vocab:<word>`, word, optional `kanji`, reading, romaji, vi, en, example {ja, vi, en}, lesson, `level: 3`, `reviewed: false`). Ids are new; no N5/N4 entry changes.
- **Kanji gate:** every kanji in `word` is in `kanji.json` at level 5, 4 or 3; otherwise `word` is in kana and the usual spelling goes in `kanji`.
- **No duplicates** with existing words (same written form + reading), and an id `vocab:<word>` must be unique. A homophone whose id is taken is skipped and listed in the batch report (BACKLOG: id scheme for same-kana words).
- **JMdict:** every (word or kanji spelling, reading) pair passes `npm run jmdict`; examples use the word and keep to N5–N3 vocabulary and kanji.
- Words of a lesson fit its theme (`lessons.json` titles); lesson 81 "Ôn tập N3" has no words.
- Batch split (4 lessons each, the last 3):

| Batch | Lessons |
|---|---|
| 28a | 46–49 |
| 28b | 50–53 |
| 28c | 54–57 |
| 28d | 58–61 |
| 28e | 62–65 |
| 28f | 66–69 |
| 28g | 70–73 |
| 28h | 74–77 |
| 28i | 78–80 |

- `content.spec.ts` inventory gets the new exact vocab counts (N5 694 + N4 578 + N3 n); FE/BE tests with fixed counts are updated with the reason.

Out: grammar (29), mock test (30), the same-kana id scheme (BACKLOG).

## Acceptance criteria (each batch)
- **AC-1** `npm run validate:content` (content spec + JMdict) passes; inventory counts exact.
- **AC-2** BE `npm run check`, FE `npm run check`, full `npm run test:e2e` pass (fixed counts updated with the reason).
- **AC-3** Screenshots of `/vocab?level=3` and one filled N3 lesson page at 360 and 1440, looked at.
- **AC-4** Every new word `reviewed: false`; the batch report lists the words the author is unsure belong to N3, the skipped homophones, and a seeded sample of 30 (§12).

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1 | `kotoba-be/content/content.spec.ts`, `scripts/jmdict-check.ts` | Vitest / script |
| AC-2, AC-3 | full suites; `e2e/levels.spec.ts` / `e2e/vocab.spec.ts` | E2E |

## §7.2 case groups
Content: happy path, wrong data (gate, duplicates, JMdict), display (long meanings in decks and the word page), large data (the file passes ~3,000 items: seed time and `/vocab?level=3` paging). Others N/A: no runtime code changes.

## Self-review notes
### 28a (lessons 46–49)
- 222 words (46: 58, 47: 52, 48: 52, 49: 60); N3 total 222, file 1,494. Slightly above ~200; nothing was padded.
- Skipped homophones (id taken): 掃く, 拭く, 揚げる, 煮る, 風邪, 咳, 肩, 恋. New ids that block future homophones: なか, した, かわ, かん, よう, こい, うつる.
- Unsure, maybe N4: 夫 妻 男性 女性 人生 親子 父親 母親 一生 和食 洋食 食品 自宅 昼寝 背中 痛み 計る マンション エアコン ダイエット 内科 外科.
- Unsure, maybe N2 (48 words, ~22% of the batch; there is no official list since 2010, so this follows the old unofficial lists): 婦人 末っ子 次男 次女 そうしき なかよし あまえる たんじょう 夜更かし 居眠り てつや 散らかす 覚ます 冷ます 住民 大家 かんりにん 和室 洋室 カーペット ソファー ベランダ いためる むく ゆでる しんせん 一口 飲み会 ワイン アルコール にわとり ぶた えさ かむ よぼう かいふく こっせつ 腹痛 白髪 くちびる つめ ひざ 手首 しんさつ かんじゃ 呼吸 体力 顔色.
- Near-synonym pairs kept: 親類/しんせき, 食品/食料. 腹 is marked as casual.
- Test change: the 5,000-row paging e2e test used synthetic level-3 rows; real N3 words now sort before them, so the synthetic rows moved to level 2 (no real N2 content). Same intent: paging and timing on 5,000 rows of one level, other levels untouched. Seen failing with level 3 before the change.
- Screenshots `/vocab?level=3` and `/lessons/47` at 360 and 1440: counts match the data, no horizontal scroll.
- Sample: seed 2811, 30 items, in the batch report.

### 28b (lessons 50–53)
- 191 words (50: 37, 51: 52, 52: 46, 53: 56); N3 total 413, file 1,685. Short of ~200: lesson 50 (nature and weather) ran out of real N3 words; the rest are N4 already or N2. Dropped as N2-ish: 霧 虹 嵐 宇宙 青空 必死 身に付ける 通行 通り過ぎる.
- Skipped homophones: none. New ids that block future homophones: とける (解ける), こうかい (公開, 航海), きげん (期限, 起源), つゆ (露, 汁), なみ, かのう, せいこう, きろく, かれる, いわ, たに, えだ, おんど, きょり, きそく, おうふく, かんしゃ.
- Unsure, maybe N4: さくら 幸せ 留学 守る けっか もくてき 料金. Maybe N2 (16 words, ~8%): 実力 才能 実現 上達 資格 やる気 終電 ため息 わくわく かれる まぶしい つゆ 山登り 大雨 大雪 こうかい.
- Checked: every N3 word written in kana has a kanji outside N5–N3 (none could have been written with kanji).
- Screenshots `/vocab?level=3` and `/lessons/50` at 360 and 1440: counts match, no horizontal scroll.
- Sample: seed 2812, 30 items, in the batch report.

### 28c (lessons 54–57)
- 206 words (54: 50, 55: 49, 56: 50, 57: 57); N3 total 619, file 1,891. Lesson 55 (movement) ran out of N3 words that are not already in the data.
- Fixed while authoring: the examples of 暗記 (used 個) and 部活 (used 授) were rewritten to keep to N5–N3 kanji; romaji of さそう/追う follow the existing `-ou` spelling (sasou, ou).
- Skipped homophones (id or spelling+reading taken): 贈る, 泊める, 留める, 振る, 貼る, 張る, 駆ける, 包装, 開く (ひらく; `vocab:開く` is あく), 移る (exists as うつる); 下りる, 上る, 下ろす share a JMdict entry with existing words. 取る and 切る are missing at every level (BACKLOG). New ids that block future homophones: まく (巻く; blocks 撒く, 蒔く), とく (解く; blocks 溶く), はなす (離す), うつす, つめる, ほる, ぬる, ふれる, むすぶ, のばす, つかむ, にぎる; `vocab:すすめる` (勧める) sits beside `vocab:進める`.
- Unsure, maybe N4 (9): 客 あいさつ ようこそ 夕食 飛ぶ 速い 付ける 分ける 存じる. Maybe N2 (17, ~8%): 訪れる 出迎える 招待状 お越し 立ち寄る 不在 見舞う 逃がす 横切る 引き返す しゃがむ 起き上がる なでる しぼる 学問 論文 ふるさと. Near-synonym pairs kept: ふりかえる/ふりむく, 学費/じゅぎょうりょう, 出会う/出会い, 抜く/抜ける.
- Screenshots `/vocab?level=3` and `/lessons/57` at 360 and 1440: "Bài 57 / 81 · 9 kanji · 57 từ" matches the data, no horizontal scroll.
- Sample: seed 2813, 30 items, in the batch report.

### 28d (lessons 58–61)
- 206 words (58: 45, 59: 52, 60: 55, 61: 54); N3 total 825, file 2,097. Lesson 58 (arts) is short: its core words already exist at N5/N4 (美術, 作家, 画家, はいゆう, 小説, まんが, 感動, 感想, 見物).
- Fixed while authoring: dropped 経済的 (的 is not in N5–N3, a kana spelling would be odd); examples of でんとう, 本番, じょうし, 報告 rewritten to keep to N5–N3 kanji. Dropped to keep the N2 share down: 上映 地位 出世 求人 財産 落語 一等 ステージ 勤務 円高 円安 消費 手数料 支払い 家計 不景気 敗れる.
- Skipped homophones: 公演 (`vocab:こうえん` is 公園), 詩 (`vocab:し` is 市); 体操 already exists. New kana ids that block future homophones include かし (歌詞; blocks 菓子, 貸し), でんとう (blocks 電灯), ためる (blocks 溜める), そうぞう (blocks 創造), きょうそう (blocks 競走), えんぎ (blocks 縁起), plus about 70 other kana ids (list in the batch report).
- Unsure, maybe N4: チーム 給料 相手 参加 係 がっき むりょう 曲 現金 店長. Maybe N2 (18, ~8.7%): えんぎ てんじ 主役 かぶき ぎゃくてん 本番 有利 不利 支出 景気 りょうしゅうしょ おうぼ きかく しんぱん 寄付 職人 赤字 黒字. Meanings to check: かんとく (director; head coach), 対, 得, 働き, パート.
- Screenshots `/vocab?level=3` and `/lessons/60` at 360 and 1440: "11 kanji · 55 từ" matches, no horizontal scroll.
- Sample: seed 2814, 30 items, in the batch report.

### 28e (lessons 62–65)
- 193 words (62: 52, 63: 46, 64: 46, 65: 49); N3 total 1,018, file 2,290. Short of ~200 by 7: the remaining theme words exist already (売り場 注文 貿易 市民 意見 賛成 反対 交番 規則 禁煙 断る 遠慮 免許 中止 利用…), are taken homophones, or look N2. Not padded.
- Fixed while authoring: 19 examples used kanji outside N5–N3 (弁 届 卵 的 訳 結 従 公 党 義 減 布 虫 故 寮 符 絡) and were moved to kana or rewritten; romaji 安売り `yasuuri`, 手に入れる `te ni ireru`, 世の中 `yo no naka`; お断り example made grammatical (ペットはお断りしています); 真実 example rewritten (was redundant). Dropped (no JMdict pair): 盗まれる, 違法 read いはん, 許される, お客.
- Skipped homophones (id taken): 駐車 (注射), 無効 (向こう), 延ばす (伸ばす), 捜す (探す), 包装 (放送), 意志 (石), 証人/商人 (しょうにん). Same reading, different spelling, added: 開店/回転, 支持/指示, 見方/味方, 法/ほう. New kana ids that block future homophones: こうかん (好感), ほしょう (保障, 補償), けいじ (掲示), しょうめい (照明), ゆうこう (友好), たいしょう (対照, 大将), plus かんり せいふ こうほ ばつ とどけ いっぱん こうきょう ふせぐ かくす さわぐ しじ ひはん ていあん けつろん.
- Unsure, maybe N4: 申し込む 市場 売れる 平和 キャンセル 解決 世の中. Maybe N2 (17, ~8.8%): 消費者 安売り ひはん 対立 首相 ていあん 意識 すり ねらう あばれる 事情 たちいりきんし けいじばん 未成年 責任者 たいしょう 貸し出し. Meanings to check: 知事, おまけ, お断り, たいおう, いっぱん and 関係者 (example translations), 法 (ほう, next to 方 in L5).
- Screenshots `/vocab?level=3` and `/lessons/63` at 360 and 1440: "Bài 63 / 81 · 10 kanji · 46 từ" matches, no horizontal scroll.
- Sample: seed 2815, 30 items, in the batch report.

### 28f (lessons 66–69)
- 215 words (66: 50, 67: 58, 68: 54, 69: 53); N3 total 1,233, file 2,505. Dropped: 花束 (off-theme), 追い付く (exists as 追いつく), 初め (exists as 始め), 太さ and 一段と (no JMdict pair), 超える (same entry as 越える), about 34 marginal or N2 words. N4/N5 words missing from the file were not added here (結構 メートル キロ グラム 決して 構う 以内 割合 程 倍 秒 軒 無くす).
- Fixed while authoring: examples of 間もなく, 重なる, 達する, しゅうりょう, りょう; 一定 meaning narrowed to "cố định, không đổi" (dropped the ambiguous "nhất định").
- Skipped homophones: 選択 (`vocab:せんたく` is 洗濯), 億 (`vocab:おく` is 置く). Same reading, different spelling, added: 正確/性格, 済む/すむ, 期限/きげん, 経つ/立つ, 番/ばん, 約/やく/役, 件/県, 欠ける/かける. New kana ids that block future homophones: えんき しめきり よゆう ちょうせい いちおう ぶじ よくじつ ちかごろ しゅんかん せいき しゅくじつ じゅんばん すでに ふたたび ついに しゅうりょう ふだん ふくすう たんじゅん りょう (blocks 寮) たいりょう けいさん へいきん だいいち わずか へらす げんしょう (blocks 現象) のびる ちぢむ かくだい はんい しだいに じょじょに いっそう はってん はぶく たまる.
- Unsure, maybe N4 (10): 数 多く 全て 残す 過ごす 以前 今回 チェック 重さ 長さ. Maybe N2 (14, ~6.5%): 日程 ちょうせい 用心 記号 単位 定員 通過 じょじょに 達する はぶく えんき 定期 いっそう 満ちる. Meanings to check: 非常 (only "khẩn cấp"), 番, 段, 定期, 件, 相当, 互い, 年間, 過ぎ, 当番, 単位, プラス/マイナス; いちおう and 念のため both use an umbrella example; romaji of に-adverbs is spaced (`tashika ni`, `sude ni`) while older data is mixed.
- Screenshots `/vocab?level=3` and `/lessons/68` at 360 and 1440: "Bài 68 / 81 · 10 kanji · 54 từ" matches, no horizontal scroll.
- Sample: seed 2816, 30 items of this batch (mulberry32 + Fisher-Yates of `scripts/sample.ts`, over lessons 66–69), in the batch report.

### 28g (lessons 70–73)
- 203 words (70: 49, 71: 58, 72: 50, 73: 46); N3 total 1,436, file 2,708. Deferred to their themed lessons: 状態 様子 (77), 違い 比較 評価 さすが (79), 信用 信頼 頼る (76), 結局 効果 (80), くずれる (74). N4 words missing from the file were not added here (変える 人気 人間 頼む つもり なぜ メール 郵便 できる 無くなる).
- Fixed in review: example translations of 流行る ("đang lây lan"), ちえ ("góp trí khôn"), スピーチ ("phát biểu"); 思い meaning widened to "suy nghĩ, tâm tư, tình cảm".
- Skipped homophones: 現象 (`vocab:げんしょう` is 減少), 低下 (`vocab:ていか` is 定価), 温まる (`vocab:あたたまる` is 暖まる), 公開 (`vocab:こうかい` taken). New kana ids that block future homophones: つうやく しょうち ちょうさ.
- Unsure, maybe N2 (~14%, higher than earlier batches): 報道 解説 読者 世間 通信 発行 発言 説得 怒鳴る 語る 本音 理論 精神 思い込む 進化 悪化 向上 人類 生命 物事 膨らむ 話し手 聞き手 世代 強まる 弱まる. Maybe N4: 形 不思議 どんどん インターネット 文字 言い方 話し中 ホームページ. Meanings to check: けいたい, 一時, 元, しょうち, りょうかい, 思い, 話し中, 流行る, ちえ.
- E2E: two timing flakes in two full runs (`sync-status.spec.ts:15` desktop, `n4-path.spec.ts:36` mobile with /register stuck on "Đang xử lý…"); each spec alone passed 4/4 and the third full run passed 176/176. Recorded in BACKLOG.
- Screenshots `/vocab?level=3` and `/lessons/71` at 360 and 1440: "Bài 71 / 81 · 8 kanji · 58 từ" matches, no horizontal scroll.
- Sample: seed 2817, 30 items of this batch (lessons 70–73), in the batch report.

### 28h (lessons 74–77)
- 189 words (74: 45, 75: 45, 76: 47, 77: 52); N3 total 1,625, file 2,897. Includes the words deferred from 28g (くずれる; 信用 信頼 頼る; じょうたい 様子). Dropped at selection as N2 or rare: 外部 しゅうへん 地区 都心 屋外 パートナー 関わる 恩 共有 きずな 助言 孤独 共働き 同期 弟子. Deferred to 79: 長所 短所. N4 words missing from the file not added: 助ける 戦争.
- Examples rewritten to pass the kanji gate: ちゅうおう, 地上, 不十分. Fixed in review: example translation of 付き合い ("Vì quan hệ công việc, tuần nào tôi cũng phải đi nhậu.").
- Skipped homophones: 空 read から (`vocab:空` is そら), 奥 (おく), 底 (そこ), 端 (はし), 沿う (そう), 硬い/堅い (かたい), 濃い (こい), 湿る (しめる), 異常 (いじょう), 意外 (いがい), 傷む (いたむ is 痛む), 誤る (あやまる), 厚い (あつい), 縁 (えん). Same reading, different id, added: 頼り/便り, 空き/あき, かんそう/感想. New kana ids that block future homophones include さける (裂ける), たて (盾, 建て), けんか (献花), こじん (故人), けいこう (携行).
- Unsure, maybe N2 (13, ~7%): ひなん ばくはつ あせる みだれる ゆだん うらぎる 交流 内部 前方 じょうきょう するどい おだやか かんそう. Maybe N4: 助かる 中心 右側 左側 手伝い つらい しっかり きちんと そのまま お世話になる. Meanings to check: 交際 ("giao thiệp; hẹn hò", example shows dating), 向き (example shows only "hướng"), 目下 read めした only, 主 (おも), 東西南北 example.
- E2E 176/176 on the first full run.
- Screenshots `/vocab?level=3` and `/lessons/77` at 360 and 1440: "Bài 77 / 81 · 11 kanji · 52 từ" matches, no horizontal scroll.
- Sample: seed 2818, 30 items of this batch (lessons 74–77), in the batch report.

### 28i (lessons 78–80, last batch)
- 149 words (78: 52, 79: 47, 80: 50); N3 total 1,774, file 3,046. Lesson 81 "Ôn tập N3" has no words. Includes the deferred 違い ひかく ひょうか さすが 長所 短所 (79) and けっきょく こうか (80). Dropped: 皆 (same JMdict entry as `vocab:みんな`). N4/N5 words missing from the file not added: 正月 お客様 おかげさまで おじゃまします 直る せっかく.
- Examples rewritten to pass the kanji gate: 先祖 (おぼん), 幸運 (じこ), 成果 (れんしゅう), 達成 (もくひょう), 仕組み (きかい), けんじょうご (まいる).
- Skipped homophones: 高価 (`vocab:こうか` is 効果, created in this batch), 努める (`vocab:つとめる` is 勤める). New kana ids that block future homophones include こうか (高価, 校歌), きく (利く, 菊), ひかく (皮革), さいかい (再会), こうきゅう (高給), かんりょう (官僚), こうりつ (公立).
- Unsure, maybe N2 (13, ~9%): 恐れ入る けんじょうご ていねいご じごく ねらい 処理 開発 進行 上等 みりょく どくとく 性能 実る. Maybe N4: 慣れる すてき 習慣 神様 記念. Meanings to check: 出来 (でき), いまいち, 礼, おぼん ("lễ Vu Lan của Nhật": お盆 is 盂蘭盆, Vu Lan Bồn, so kept).
- BE coverage at phase end 30.57/35.59/33.96/30.06 (statements/branches/functions/lines) = the thresholds rounded down; no ratchet change.
- E2E 176/176 on the first full run.
- Screenshots `/vocab?level=3` and `/lessons/78` at 360 and 1440: "Bài 78 / 81 · 8 kanji · 52 từ" matches, no horizontal scroll.
- Sample: seed 2819, 30 items of this batch (lessons 78–80), in the batch report.
