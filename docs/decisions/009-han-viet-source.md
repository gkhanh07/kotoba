# ADR 009: where Hán Việt readings come from

- Status: accepted
- Date: 2026-11-08

## Context
`kanji.json` `hv` was copied from KANJIDIC2's `r_type="vietnam"` readings. That field is contributed and mixes in Nôm and wrong readings: 戦 "Khuyết", 伝 "Vân", 払 "Chàng", and a reading for 込, a kanji made in Japan (BUG-009). AGENTS.md §12 forbids inventing readings, so a fix needs a cited, licensed source.

## Options
- (a) Keep KANJIDIC2 and patch the known cases by hand. Every other wrong reading stays, and the patches have no source.
- (b) Author `hv` in `kanji.json`, checked against [hanviet-pinyin-wordlist](https://github.com/ph0ngp/hanviet-pinyin-wordlist) (MIT, Copyright (c) 2024 Phong Phan). It lists traditional characters, so shinjitai are matched through Unihan variants and a short shinjitai→kyūjitai map (楽→樂, 伝→傳, 戦→戰 …).
- (c) Drop Hán Việt from the app. It is a main reason Vietnamese learners use kanji cards.

## Decision
(b).
- `hv` is an authored field: `scripts/kanjidic.ts` keeps it like `vi`, `lesson`, `similar`, and never reads it from KANJIDIC2 again.
- The rule: a reading stays only if the list has it for the character (or its traditional form). Every reading of all 625 kanji was checked against the list: 618 match it; 6 keep a KANJIDIC2 reading where the list gives only another one (受 Thụ, 割 Cát, 横 Quáng, 捕 Bộ, 冷 Lãnh, 箱 Tương; the list has thọ, cắt, hoành, bắt, lạnh, rương); 込 has none (`[]`), and the page says it is a Japanese-made kanji.
- Readings the list has but that learners do not need were left out: 予 Dữ, 説 Thuế, 万 Mặc, 未 Mùi.
- Spelling follows the list: 姉 Tỷ (the list has tỷ), 医 Y. Every `hv` is stored in Unicode NFC (37 KANJIDIC2 readings were decomposed). 未 Mùi is arguable (it is the zodiac name); it can come back if the user wants it.
- `content.spec.ts` locks the corrected readings and requires `hv` on every kanji except `NO_HAN_VIET`.

## Consequences
- 156 kanji change `hv`. Content ids do not change and no stored progress refers to `hv`, so there is no migration.
- The kanji review samples drawn before this change are out of date and are redrawn (§12).
- The legal page credits the list instead of KANJIDIC2 for Hán Việt.
- New kanji (N2 or later) need their `hv` authored and checked the same way; `kanjidic.ts` alone leaves it empty and the content test fails.

## Appendix: KANJIDIC2 readings dropped because the list does not have them

196 readings in 137 kanji. They are mostly Nôm readings (内 Nồi, 強 Gượng, 来 Rơi), southern or old variants the list does not carry (本 Bổn, 生 Sanh, 政 Chánh, 西 Tê), or readings of another character (戦 Khuyết, 伝 Vân). 正 keeps Chánh because the list has it for 正.

国 Cuốc, 会 Hụi, 大 Thái, 本 Bổn, 長 Trướng, 出 Xúy, 三 Tám, 時 Thì, 政 Chánh, 後 Hấu, 生 Sanh, 発 Bát, 内 Nạp, 内 Nói, 内 Nòi, 内 Nồi, 内 Nỗi, 内 Nụi, 定 Đính, 回 Hối, 員 Vân, 九 Cưu, 選 Tuyến, 戦 Khuyết, 言 Ngân, 下 Há, 不 Phầu, 不 Phủ, 不 Phi, 来 Lãi, 来 Lơi, 来 Ray, 来 Rơi, 治 Trì, 強 Càng, 強 Cướng, 強 Cượng, 強 Gàn, 強 Gàng, 強 Gắng, 強 Gương, 強 Gượng, 強 Ngượng, 期 Ky, 機 Ky, 平 Biền, 山 San, 思 Tai, 家 Cô, 県 Huyền, 数 Xúc, 数 Sỗ, 数 Sộ, 数 Xọ, 女 Nứ, 産 Sẵn, 産 Sởn, 百 Bá, 百 Mạch, 済 Tề, 活 Quạt, 先 Tiến, 共 Cung, 解 Giới, 解 Giái, 勝 Thăng, 告 Cốc, 告 Cáu, 告 Kiếu, 文 Vấn, 反 Phiên, 近 Cấn, 近 Ký, 参 Tảm, 参 Xam, 参 Khươm, 売 Xác, 売 Xạc, 道 Đáo, 任 Nhậm, 引 Dấn, 論 Luân, 計 Kê, 示 Kì, 変 Bén, 変 Biếng, 始 Thí, 西 Tê, 台 Thai, 台 Di, 容 Dong, 歳 Tuổi, 争 Tránh, 争 Chanh, 争 Danh, 能 Nai, 能 Nại, 格 Các, 有 Dựu, 放 Phỏng, 校 Giáo, 校 Hào, 料 Liêu, 建 Kiển, 空 Khổng, 土 Độ, 土 Đỗ, 聞 Vấn, 聞 Vặn, 費 Bỉ, 切 Thế, 説 Duyệt, 説 Thoát, 説 Thót, 説 Thốt, 研 Nghiễn, 研 Nghiến, 研 Nghiền, 研 Nghiện, 収 Thua, 断 Đón, 番 Ba, 番 Bà, 害 Hạt, 着 Khán, 質 Chí, 伝 Vân, 退 Thối, 医 Ế, 医 Ỷ, 医 Ỉ, 去 Khu, 差 Soa, 差 Sái, 守 Thú, 横 Vàng, 呼 Há, 悪 Óc, 図 Vi, 積 Tí, 殺 Sái, 殺 Tát, 赤 Thích, 単 Đạn, 責 Trái, 迎 Nghịnh, 左 Tá, 父 Phủ, 夏 Giạ, 夏 Giá, 亡 Vô, 適 Đích, 込 Liêu, 顔 Nhăn, 薬 Ước, 頼 Trái, 覚 Dác, 許 Hử, 許 Hổ, 静 Tịnh, 喜 Hí, 絶 Tiệt, 絶 Tịt, 絶 Toẹt, 払 Chàng, 庭 Thính, 居 Kí, 招 Thiêu, 招 Thiều, 恐 Khúng, 遠 Viển, 絵 Gói, 絵 Gối, 越 Hoạt, 束 Thú, 探 Tham, 夢 Mông, 雨 Vú, 折 Đề, 飲 Hẩm, 飲 Ỡm, 肉 Nhụ, 肉 Nậu, 貸 Thắc, 飯 Phãn, 盗 Bàn, 御 Nhạ, 洗 Tiển, 怖 Phố, 頂 Đính, 箱 Sương, 晩 Hào, 晩 Mạn, 晩 Man, 姉 Chị, 幾 Kí
